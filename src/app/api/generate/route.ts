import { NextResponse } from 'next/server';
import { generateObject, embed } from 'ai'; 
import { createVertex } from '@ai-sdk/google-vertex';
import { wisdomAgent, dailyWisdomSchema, modelDef } from '@/mastra/agents/wisdomAgent';
import { db } from '@/lib/db'; // 作成したDBクライアント

export const maxDuration = 60; 

export async function GET() {
  try {
    console.log('Starting generation process...');

    // 1. 【Retrieval】過去の直近データを取得して「禁止リスト」を作る
    // ベクトル検索で「似たもの」を探すのも手だが、
    // 「直近で話したこと」を避けるには、単純に新しい順にタイトルを取得するのが確実。
    const recentWisdoms = await db.execute({
      sql: "SELECT title, category FROM wisdom_items ORDER BY created_at DESC LIMIT 30",
      args: []
    });

    const avoidList = recentWisdoms.rows.map(row => `[${row.category}] ${row.title}`).join('\n');
    console.log(`Avoid list created (${recentWisdoms.rows.length} items)`);

    // 2. システムプロンプトに追加の指示（コンテキスト）を注入
    // RAGの「検索結果をプロンプトに含める」アプローチです。
    const systemInstruction = `
      ${wisdomAgent.instructions}

      ### 重要：重複排除の指示
      以下のトピックは最近扱ったため、**絶対に**選ばないでください。
      これらとは異なる、新しい視点のトピックを選んでください。
      
      【禁止トピックリスト】
      ${avoidList}
    `;

    // 3. 【Generation】生成実行
    console.log('Generating wisdom with VertexAI...');
    const { object } = await generateObject({
      model: modelDef,
      system: systemInstruction, // 更新した指示を使用
      prompt: "今日の5つのトピックを生成してください。",
      schema: dailyWisdomSchema,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'generate-disney-wisdom',
        metadata: {
          date: new Date().toISOString().split('T')[0],
          avoidListCount: recentWisdoms.rows.length,
        },
      },
    });

    // 4. 【Indexing】生成結果をベクトル化してDBに保存
    console.log('Saving and embedding results...');
    
    // 並列処理で高速化
    await Promise.all(object.items.map(async (item) => {
      // (A) 解説本文をベクトル化 (Embedding)
      const googleVertex = createVertex({
        project: process.env.GOOGLE_VERTEX_PROJECT,
        location: process.env.GOOGLE_VERTEX_LOCATION,
      });

      const { embedding } = await embed({
        model: googleVertex.textEmbeddingModel('text-embedding-004'),
        value: `${item.title}: ${item.content}`,
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'embed-wisdom-item',
          metadata: {
            category: item.category,
            title: item.title,
          },
        },
      });

      // (B) SQLで保存
      await db.execute({
        sql: `INSERT INTO wisdom_items 
              (date, category, title, content, quiz_json, embedding) 
              VALUES (?, ?, ?, ?, ?, vector32(?))`, // vector32ヘルパーが必要な場合があるが、通常は配列渡しでOK
        args: [
          object.date,
          item.category,
          item.title,
          item.content,
          JSON.stringify(item.quiz),
          new Float32Array(embedding).buffer // LibSQLにはBlob(Buffer)として渡すのが一般的
          // もしエラーが出る場合は JSON.stringify(embedding) を試す
        ]
      });
    }));

    console.log('All items saved successfully!');

    return NextResponse.json(object);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Error:', message);
    return NextResponse.json(
      { error: 'Failed to generate wisdom', details: message },
      { status: 500 }
    );
  }
}