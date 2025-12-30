// src/mastra/agents/wisdomAgent.ts
import { Agent } from '@mastra/core/agent';
// import { bedrock } from "@ai-sdk/amazon-bedrock";
import { vertex } from '@ai-sdk/google-vertex';
import { z } from 'zod';

// export const modelDef = bedrock("us.anthropic.claude-3-7-sonnet-20250219-v1:0");
export const modelDef = vertex("gemini-2.5-flash");

// 出力データの「型」を定義 
export const dailyWisdomSchema = z.object({
  date: z.string().describe("今日の日付 (例: 2025-05-20)"),
  items: z.array(
    z.object({
      category: z.enum([
        'Park Secret',     // 隠れミッキー、BGS（バックグラウンドストーリー）、プロップスの秘密
        'Movie Trivia',    // アトラクションの元ネタとなった映画の知識
        'Attraction',      // アトラクションの仕組み、見逃しがちな演出
        'Food & Merch',    // レストランの物語、ワゴンフードの豆知識
        'History',         // ウォルト・ディズニーの精神、パーク建設の歴史
        'Character'        // キャラクターの性格、グリーティングのコツ
      ]).describe("ディズニー知識のジャンル"),
      
      title: z.string().describe("「知りたい！」と思わせる魔法のようなタイトル"),
      
      // 内容の指示を「パーク体験の向上」に向けさせる
      content: z.string().describe("300文字程度の解説。初心者がパークに行った際、「これ知ってる！」と友達に自慢できたり、アトラクションの待ち時間が楽しくなったりするような、体験に深みを与える内容にすること。"),
      
      quiz: z.object({
        question: z.string().describe("その知識に基づいた、パークで確認したくなるクイズ"),
        options: z.array(z.string()).length(4).describe("4つの選択肢"),
        correctAnswer: z.string().describe("正解の選択肢（文字列そのもの）"),
        explanation: z.string().describe("正解の解説と、補足トリビア"),
      })
    })
  ).length(5).describe("必ず異なるジャンルから5つのトピックを生成すること")
});

// エージェントを作成
export const wisdomAgent = new Agent({
  name: 'Disney Concierge',
  instructions: `
    あなたはディズニーリゾートとディズニー作品に精通した、世界一の「ディズニーコンシェルジュ」です。
    ディズニー初心者であるユーザーが、ディズニーリゾート（ランド・シー）を訪れた際に「120%楽しめる」ようになるための、魔法のような知識を授けてください。

    以下のルールを厳守してください：
    1. **「パーク体験」に紐づけること**: 単なる映画のあらすじではなく、「この映画のこのシーンを知っていると、あのアトラクションのQライン（待機列）にあるプロップスの意味がわかる」といった、現地で役立つ視点で解説してください。
    2. **初心者への配慮**: 専門用語（BGS、Qラインなど）を使う場合は、さりげなく意味を補足するか、わかりやすい言葉で伝えてください。
    3. **ワクワク感**: 読むだけでパークに行きたくなるような、ポジティブで夢のあるトーンで話してください。
    4. 必ず指定されたJSON形式で出力すること。
  `,
  model: modelDef,
});