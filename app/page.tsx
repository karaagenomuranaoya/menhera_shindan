"use client";
import { useState } from "react";
import { motion } from "framer-motion";

// 型定義更新
type DiagnosisResult = {
  score: number;
  title: string;
  chart: { humidity: number; pressure: number; delusion: number };
  highlight_quote: string;
  comment: string;
  short_reviews: string[]; // ← 追加
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ q1: "", q2: "", q3: "" });
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const handleInput = (key: string, value: string) => {
    setAnswers({ ...answers, [key]: value });
  };

  const analyze = async () => {
    setStep(4);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      setResult(data);
      setStep(5);
    } catch (e) {
      alert("診断エラー！もう一度試してね");
      setStep(3);
    }
  };

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-black/50 p-6 rounded-2xl border border-purple-900/50 shadow-2xl backdrop-blur-sm overflow-hidden">
        
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 text-center mb-8">
          Aim for the<br />Menhera King
        </h1>

        {/* Step 0 ~ 4 は変更なし（そのまま使えます） */}
        {step === 0 && (
          <div className="text-center space-y-6">
            <p className="text-gray-300">あなたの愛は、凶器か、芸術か。<br/>AIがあなたの「重さ」を測定します。</p>
            <button onClick={() => setStep(1)} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-lg hover:opacity-90 transition">診断を始める</button>
          </div>
        )}

        {[1, 2, 3].includes(step) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-gray-800 p-3 rounded-lg rounded-tl-none inline-block max-w-[85%] text-sm">
              {step === 1 && "彼から5時間返信がない（既読はついてる）。なんて送る？"}
              {step === 2 && "深夜2時。急に情緒が不安定になった。彼にLINE送っちゃおう。"}
              {step === 3 && "最近、彼の様子がおかしい（浮気？）。釘を刺す一言を送って。"}
            </div>
            <textarea
              className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-pink-500 min-h-[120px]"
              placeholder="ここにメッセージを入力..."
              value={step === 1 ? answers.q1 : step === 2 ? answers.q2 : answers.q3}
              onChange={(e) => handleInput(`q${step}`, e.target.value)}
            />
            <button
              onClick={() => step < 3 ? setStep(step + 1) : analyze()}
              className="w-full py-3 bg-purple-700 rounded-xl font-bold mt-2 disabled:opacity-50"
              disabled={!answers[`q${step}` as keyof typeof answers]}
            >
              {step < 3 ? "次へ送信 ▷" : "診断する 🔥"}
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <div className="text-center py-10 space-y-4">
            <div className="animate-pulse text-pink-500 text-xl font-bold">診断中...</div>
            <p className="text-xs text-gray-500">既読がついたり消えたりしています</p>
          </div>
        )}

        {/* Step 5: 結果発表（ここを拡張！） */}
        {step === 5 && result && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6 text-center"
          >
            {/* 総合評価エリア */}
            <div>
              <p className="text-sm text-purple-400">メンヘラ偏差値</p>
              <div className="text-7xl font-black text-pink-500 tracking-tighter drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                {result.score}
              </div>
              <div className="mt-2 inline-block bg-purple-900/50 px-4 py-1 rounded-full border border-purple-500 text-purple-200 font-bold">
                称号：{result.title}
              </div>
            </div>

            {/* 修正後: これに書き換えてください */}
<div className="grid grid-cols-3 gap-2 text-xs">
  <div className="bg-gray-800 p-2 rounded">
    <div className="text-gray-400">湿度</div>
    <div className="text-lg font-bold text-blue-400">
      {result.chart?.humidity ?? 0}%
    </div>
  </div>
  <div className="bg-gray-800 p-2 rounded">
    <div className="text-gray-400">圧</div>
    <div className="text-lg font-bold text-red-500">
      {result.chart?.pressure ?? 0}%
    </div>
  </div>
  <div className="bg-gray-800 p-2 rounded">
    <div className="text-gray-400">妄想</div>
    <div className="text-lg font-bold text-purple-400">
      {result.chart?.delusion ?? 0}%
    </div>
  </div>
</div>

            {/* ハイライト */}
            <div className="text-left bg-[#252525] p-4 rounded-xl border-l-4 border-pink-500">
              <p className="text-[10px] text-gray-400 mb-1">HIGHLIGHT</p>
              <p className="font-serif italic text-lg text-gray-200">"{result.highlight_quote}"</p>
            </div>

            {/* 総評 */}
            <p className="text-sm text-gray-300 leading-relaxed bg-black/30 p-4 rounded-lg">
              {result.comment}
            </p>

            {/* --- ここから追加：各回答への個別レビュー --- */}
            <div className="mt-6 text-left space-y-3 pt-6 border-t border-gray-800">
              <h3 className="text-xs font-bold text-gray-500 uppercase">Review Log</h3>
              
              {/* Q1のレビュー */}
              <div className="bg-gray-900/80 p-3 rounded-lg text-sm">
                 <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Q1: 既読無視</span>
                 </div>
                 <p className="text-gray-300 mb-2 border-l-2 border-gray-600 pl-2">"{answers.q1}"</p>
                 <p className="text-pink-400 font-bold text-xs">師範代: {result.short_reviews[0]}</p>
              </div>

              {/* Q2のレビュー */}
              <div className="bg-gray-900/80 p-3 rounded-lg text-sm">
                 <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Q2: 深夜のポエム</span>
                 </div>
                 <p className="text-gray-300 mb-2 border-l-2 border-gray-600 pl-2">"{answers.q2}"</p>
                 <p className="text-pink-400 font-bold text-xs">師範代: {result.short_reviews[1]}</p>
              </div>

               {/* Q3のレビュー */}
               <div className="bg-gray-900/80 p-3 rounded-lg text-sm">
                 <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Q3: 浮気牽制</span>
                 </div>
                 <p className="text-gray-300 mb-2 border-l-2 border-gray-600 pl-2">"{answers.q3}"</p>
                 <p className="text-pink-400 font-bold text-xs">師範代: {result.short_reviews[2]}</p>
              </div>
            </div>
            {/* --- 追加ここまで --- */}

            <button 
              onClick={() => { setStep(0); setAnswers({q1:"", q2:"", q3:""}); }}
              className="text-sm text-gray-500 underline hover:text-white pb-8"
            >
              もう一度診断する
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}