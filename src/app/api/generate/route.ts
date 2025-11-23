// src/app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { generateObject } from 'ai'; // ai SDKの関数を直接インポート
// import { wisdomAgent, dailyWisdomSchema } from '@/mastra/agents/wisdomAgent';
import { wisdomAgent, dailyWisdomSchema, modelDef } from '@/mastra/agents/wisdomAgent';

export const maxDuration = 60; 

export async function GET() {
  try {
    console.log('Generating wisdom...');
    
    // MastraのAgent定義から「モデル」と「指示」を借りて、
    // 直接 AI SDK で実行します。これが一番エラーが起きにくい構成です。
    const { object } = await generateObject({
      model: modelDef, // wisdomAgentで設定したBedrockモデルを再利用
      system: wisdomAgent.instructions, // wisdomAgentの指示を再利用
      prompt: "今日の5つのトピックを生成してください。",
      schema: dailyWisdomSchema, // ここでZodスキーマを適用
    });

    console.log('Generation complete!');

    return NextResponse.json(object);

  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate wisdom', details: error.message },
      { status: 500 }
    );
  }
}