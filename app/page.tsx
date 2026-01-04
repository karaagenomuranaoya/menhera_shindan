"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// 質問の候補リスト
const QUESTION_CANDIDATES = [
  "彼から5時間返信がない。追いLINEするなら？",
  "深夜2時。溢れ出した情緒をそのままメッセージにしてぶつけて。",
  "彼の浮気疑惑。釘を刺す決定的な一言をどうぞ。",
  "彼のが他の女の子の投稿に「いいね」してた。どう詰める？",
  "「もう疲れた」と言われた時の、彼を逃がさないための一言。"
];

type DiagnosisResult = {
  score: number;
  grade: "SSS" | "SS" | "S" | "A" | "B" | "C" | "D" | "E";
  rank_name: string;
  warning: string;
  chart: { humidity: number; pressure: number; delusion: number };
  comment: string;
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    if (step === 0) {
      const randomIdx = Math.floor(Math.random() * QUESTION_CANDIDATES.length);
      setSelectedQuestion(QUESTION_CANDIDATES[randomIdx]);
    }
  }, [step]);

  const analyze = async () => {
    setStep(2);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: selectedQuestion,
          answer: answer 
        }),
      });
      const data = await res.json();
      setResult(data);
      setStep(3);
    } catch (e) {
      alert("診断エラー！");
      setStep(1);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f5ff] text-purple-900 flex flex-col items-center justify-center p-4 font-sans selection:bg-purple-200">
      <div className="w-full max-w-md bg-white/70 p-6 rounded-[2.5rem] border border-purple-100 shadow-2xl shadow-purple-200/50 backdrop-blur-xl">
        
        <h1 className="text-2xl font-black text-center mb-8 tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-pink-400">
          AIメンヘラ診断<br/><span className="text-xs font-bold text-purple-300 tracking-normal">AI Menhera Check</span>
        </h1>

        {step === 0 && (
          <div className="text-center space-y-6">
            <p className="text-purple-400/80 text-sm leading-relaxed font-medium">あなたの愛の重さを<br/>メンヘラのお友達AIが診断します。</p>
            <button 
              onClick={() => setStep(1)} 
              className="w-full py-4 bg-gradient-to-r from-purple-400 to-pink-300 text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-200"
            >
              入室する
            </button>
          </div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="text-[10px] text-purple-400 font-black mb-1 tracking-tighter">QUESTION FOR YOU</div>
            <div className="bg-purple-50/80 p-5 rounded-3xl rounded-tl-none text-sm border border-purple-100 text-purple-800 shadow-inner">
              {selectedQuestion}
            </div>
            <textarea
              className="w-full bg-white/50 border border-purple-100 rounded-2xl p-4 text-purple-900 focus:outline-none focus:border-purple-300 min-h-[120px] transition-colors placeholder-purple-200 text-sm shadow-sm"
              placeholder="メッセージを入力..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button
              onClick={() => analyze()}
              className="w-full py-4 bg-purple-500 text-white rounded-2xl font-black disabled:opacity-30 disabled:grayscale transition-all shadow-md shadow-purple-100"
              disabled={!answer}
            >
              診断する
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <div className="text-center py-20">
            <div className="animate-spin inline-block w-8 h-8 border-[3px] border-purple-300 border-t-purple-500 rounded-full mb-4"></div>
            <p className="text-purple-400 font-bold animate-pulse">お友達になれるかな...</p>
          </div>
        )}

        {step === 3 && result && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 text-center">
            {/* ランク・メイン表示 */}
            <div className="space-y-4 relative">
              <div className="text-[10px] text-purple-300 tracking-[0.2em] font-black">RESULT</div>
              <div className="text-6xl font-black text-pink-400 drop-shadow-[0_4px_10px_rgba(244,114,182,0.3)] italic mt-2">
                Rank : {result.grade}
              </div>
              <motion.div 
                initial={{ rotate: -5, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative w-64 h-64 mx-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-300 to-purple-300 rounded-[2.5rem] blur-3xl opacity-40 animate-pulse"></div>
                <img 
                  src={`/${result.grade}.png`} 
                  alt={result.grade}
                  className="relative w-full h-full object-cover rounded-[2rem] border-4 border-white shadow-xl"
                />
              </motion.div>
              <div className="text-xl font-black text-purple-800 pt-4">
                {result.rank_name}
              </div>
              <motion.div 
                animate={{ scale: [1, 1.03, 1] }} 
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="inline-block bg-pink-50 text-pink-400 px-5 py-1.5 rounded-full border border-pink-100 text-xs font-bold"
              >
                {result.warning}
              </motion.div>
            </div>

            {/* 質問・回答・総評セクション */}
            <div className="space-y-6 text-left px-2 border-t border-purple-100 pt-6">
              {/* スコア表示をランクと同じスタイルで追加 */}
              <div className="text-center mb-4">
                <div className="text-6xl font-black text-pink-400 drop-shadow-[0_4px_10px_rgba(244,114,182,0.3)] italic">
                  Score : {result.score}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Question</span>
                <p className="text-xs text-purple-800 font-medium leading-relaxed">{selectedQuestion}</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border-2 border-pink-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-pink-100 text-pink-500 text-[9px] font-black px-3 py-1 rounded-bl-xl tracking-tighter">YOUR ANSWER</div>
                <p className="text-base text-purple-900 font-bold leading-relaxed pt-2">
                  {answer}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-pink-300 uppercase tracking-widest">Review</span>
                <p className="text-sm text-purple-800/80 font-medium leading-relaxed">
                  {result.comment}
                </p>
              </div>
            </div>

            <button 
              onClick={() => { setStep(0); setAnswer(""); }}
              className="text-xs text-purple-300 font-bold underline decoration-purple-100 underline-offset-4 hover:text-purple-400 transition-colors pt-4"
            >
              再診断を受ける
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}