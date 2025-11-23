// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';

// --- 型定義 ---
interface Quiz {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface WisdomItem {
  category: string;
  title: string;
  content: string;
  quiz: Quiz;
}

interface WisdomData {
  date: string;
  items: WisdomItem[];
}

export default function Home() {
  // --- State ---
  const [data, setData] = useState<WisdomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [mode, setMode] = useState<'reading' | 'quiz'>('reading');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // 今日付を取得するヘルパー関数 (YYYY-MM-DD形式)
  const getTodayDate = () => {
    // 日本時間で取得するためのオフセット調整
    const d = new Date();
    const jstDate = new Date(d.getTime() + (9 * 60 * 60 * 1000) + d.getTimezoneOffset() * 60000);
    return jstDate.toISOString().split('T')[0];
  };

  // --- 初期化 & データ取得ロジック ---
  useEffect(() => {
    const today = getTodayDate();
    const STORAGE_KEY = 'daily-wisdom-data';

    // 1. まずローカルストレージを確認
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    if (savedData) {
      try {
        const parsed: WisdomData = JSON.parse(savedData);
        // 保存データの「日付」と「今日」が同じなら、APIを呼ばずにそれを使う
        if (parsed.date === today) {
          console.log("Using cached data from localStorage");
          setData(parsed);
          setLoading(false);
          return; // ここで終了（APIは叩かない）
        }
      } catch (e) {
        console.error("Storage parse error", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // 2. データがない、または日付が古い場合はAPIから取得
    const fetchData = async () => {
      try {
        console.log("Fetching new data from API...");
        const res = await fetch('/api/generate');
        if (!res.ok) throw new Error('API Error');
        
        const json: WisdomData = await res.json();
        
        // 日付を強制的に今日にする（API側のズレ防止）
        json.date = today;

        // 保存 & 状態更新
        localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
        setData(json);
      } catch (error) {
        console.error("Error fetching wisdom:", error);
        alert("データの取得に失敗しました。時間をおいて再読み込みしてください。");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- UI操作ハンドラー ---
  const handleAnswer = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    
    const currentItem = data?.items[currentIndex];
    if (currentItem && option === currentItem.quiz.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (!data) return;
    if (currentIndex < data.items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setMode('reading');
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  // デバッグ用: キャッシュ削除ボタン
  const clearCache = () => {
    if (confirm('今日のデータを削除して、新しく作り直しますか？')) {
      localStorage.removeItem('daily-wisdom-data');
      window.location.reload();
    }
  };

  // --- レンダリング ---

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-50 mb-4"></div>
        <p className="text-gray-600 font-medium">本日の教養を生成しています...</p>
        <p className="text-sm text-gray-400 mt-2">（初回は30秒ほどかかります）</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">学習完了！🎉</h2>
          <div className="text-6xl font-black text-blue-600 mb-2">{score} / 5</div>
          <p className="text-gray-500 text-sm mb-8">正解数</p>
          <div className="space-y-3">
            <p className="text-gray-600 font-medium">また明日お会いしましょう。</p>
            <button 
              onClick={clearCache}
              className="text-xs text-gray-400 underline hover:text-gray-600"
            >
              (デバッグ用) データをリセットして再生成
            </button>
          </div>
        </div>
      </div>
    );
  }

  const item = data?.items[currentIndex];
  if (!item) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>{data?.date}</span>
          <span>{currentIndex + 1} / 5</span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-[500px]">
        <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 uppercase tracking-wide flex justify-between">
          <span>{item.category}</span>
          {/* デバッグ用リセットボタン（開発中便利です） */}
          <button onClick={clearCache} className="opacity-50 hover:opacity-100">↻</button>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          {mode === 'reading' && (
            <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 leading-tight">{item.title}</h2>
              <div className="text-gray-600 leading-relaxed space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                {item.content}
              </div>
              <button
                onClick={() => setMode('quiz')}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition transform active:scale-95"
              >
                理解度クイズに挑戦
              </button>
            </div>
          )}

          {mode === 'quiz' && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Q. {item.quiz.question}</h3>
              <div className="space-y-3 flex-1">
                {item.quiz.options.map((option, idx) => {
                  let btnClass = "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
                  if (selectedOption) {
                    if (option === item.quiz.correctAnswer) {
                      btnClass = "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-500";
                    } else if (option === selectedOption) {
                      btnClass = "bg-red-100 border-red-500 text-red-800";
                    } else {
                      btnClass = "opacity-50";
                    }
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      disabled={!!selectedOption}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${btnClass}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {selectedOption && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm font-bold text-blue-800 mb-1">
                    {selectedOption === item.quiz.correctAnswer ? "✨ 正解！" : "🤔 残念..."}
                  </p>
                  <p className="text-sm text-blue-700">{item.quiz.explanation}</p>
                </div>
              )}
              {selectedOption && (
                <button
                  onClick={handleNext}
                  className="mt-4 w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition"
                >
                  {currentIndex < 4 ? "次のトピックへ" : "結果を見る"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}