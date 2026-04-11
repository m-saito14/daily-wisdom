import { NextResponse } from 'next/server';
import { generateObject, embed } from 'ai';
import { createVertex } from '@ai-sdk/google-vertex';
import { wisdomAgent, dailyWisdomSchema, modelDef } from '@/mastra/agents/wisdomAgent';
import { db } from '@/lib/db'; // 作成したDBクライアント
import { langfuse } from '@/lib/langfuse';

export const maxDuration = 60;

// Langfuse に登録するプロンプトのフォールバック定義
// Langfuse ダッシュボードで "disney-wisdom-system" という名前で作成し、
// {{avoid_list}} をプレースホルダーとして使用してください
const FALLBACK_SYSTEM_PROMPT = `${wisdomAgent.instructions}

### 重要：重複排除の指示
以下のトピックは最近扱ったため、**絶対に**選ばないでください。
これらとは異なる、新しい視点のトピックを選んでください。

【禁止トピックリスト】
{{avoid_list}}`;

export async function GET() {
  try {
    console.log('Starting generation process...');

    // 1. 【Retrieval】過去の直近データを取得して「禁止リスト」を作る
    const recentWisdoms = await db.execute({
      sql: "SELECT title, category FROM wisdom_items ORDER BY created_at DESC LIMIT 30",
      args: []
    });

    const avoidList = recentWisdoms.rows.map(row => `[${row.category}] ${row.title}`).join('\n');
    console.log(`Avoid list created (${recentWisdoms.rows.length} items)`);

    // 2. 【Prompt】Langfuse からシステムプロンプトを取得してコンパイル
    // Langfuse に未登録の場合はフォールバックプロンプトを使用
    const promptTemplate = await langfuse.getPrompt('disney-wisdom-system', undefined, {
      fallback: FALLBACK_SYSTEM_PROMPT,
    });
    const systemInstruction = promptTemplate.compile({ avoid_list: avoidList });
    console.log(`Prompt source: ${promptTemplate.isFallback ? 'local fallback' : 'Langfuse'}`);

    // 3. 【Generation】生成実行
    console.log('Generating wisdom with VertexAI...');
    const { object } = await generateObject({
      model: modelDef,
      system: systemInstruction,
      prompt: "今日の5つのトピックを生成してください。",
      schema: dailyWisdomSchema,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'generate-disney-wisdom',
        metadata: {
          date: new Date().toISOString().split('T')[0],
          avoidListCount: recentWisdoms.rows.length,
          promptSource: promptTemplate.isFallback ? 'fallback' : 'langfuse',
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
              VALUES (?, ?, ?, ?, ?, vector32(?))`,
        args: [
          object.date,
          item.category,
          item.title,
          item.content,
          JSON.stringify(item.quiz),
          new Float32Array(embedding).buffer
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
