// src/mastra/agents/wisdomAgent.ts
import { Agent } from '@mastra/core/agent';
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { z } from 'zod';

export const modelDef = bedrock("us.anthropic.claude-3-7-sonnet-20250219-v1:0");

// 1. 出力データの「型」を定義 (そのまま残します)
export const dailyWisdomSchema = z.object({
  date: z.string().describe("今日の日付 (例: 2025-05-20)"),
  items: z.array(
    z.object({
      category: z.enum([
        'History', 'Science', 'Art', 'Business', 'Philosophy', 'Technology', 'Nature', 'Psychology'
      ]).describe("トピックのジャンル"),
      title: z.string().describe("興味を惹くタイトル"),
      content: z.string().describe("300文字程度の詳細な解説。読者が『へぇ〜』と思うような豆知識を含めること。"),
      quiz: z.object({
        question: z.string().describe("解説内容に基づいた理解度確認クイズ"),
        options: z.array(z.string()).length(4).describe("4つの選択肢"),
        correctAnswer: z.string().describe("正解の選択肢（文字列そのもの）"),
        explanation: z.string().describe("なぜその答えになるのかの解説"),
      })
    })
  ).length(5).describe("必ず異なるジャンルから5つのトピックを生成すること")
});

// 2. エージェント(AI人格)を作成 (outputsを削除しました)
export const wisdomAgent = new Agent({
  name: 'Wisdom Professor',
  instructions: `
    あなたは博識でユーモアのある大学教授です。
    ユーザーの教養を深めるために、毎日異なる分野からランダムに5つのトピックを選び、解説してください。

    以下のルールを厳守してください：
    1. ジャンルはバラバラに選ぶこと（例：歴史ばかりにしない）。
    2. 解説は初心者にもわかりやすく、かつ知的好奇心を刺激する内容にすること。
    3. 必ず指定されたJSON形式で出力すること。余計な会話文は不要です。
  `,
//   model: bedrock("us.anthropic.claude-3-7-sonnet-20250219-v1:0"),
  model: modelDef,
});