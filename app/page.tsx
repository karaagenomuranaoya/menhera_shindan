"use client";
import { useState } from "react";
import { motion } from "framer-motion";

type DiagnosisResult = {
  score: number;
  grade: string;
  rank_name: string;
  warning: string;
  chart: { humidity: number; pressure: number; delusion: number };
  highlight_quote: string;
  comment: string;
  short_reviews: string[];
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
      alert("診断エラー！");
      setStep(3);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-black/60 p-6 rounded-3xl border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] backdrop-blur-md">
        
        <h1 className="text-2xl font-black text-center mb-8 tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-500">
          メンヘラ診断<br/><span className="text-sm font-normal text-purple-400">Menhera Diagnosis</span>
        </h1>

        {step === 0 && (
          <div className="text-center space-y-6">
            <p className="text-gray-400 text-sm leading-relaxed">あなたの愛の重さを、<br/>メンヘラ界のカリスマが格付けします。</p>
            <button onClick={() => setStep(1)} className="w-full py-4 bg-purple-600 rounded-2xl font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20">入室する</button>
          </div>
        )}

        {[1, 2, 3].includes(step) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="text-xs text-purple-400 font-bold mb-1">QUESTION 0{step}</div>
            <div className="bg-gray-800/50 p-4 rounded-2xl rounded-tl-none text-sm border border-gray-700">
              {step === 1 && "彼から5時間返信がない。追いLINEするなら？"}
              {step === 2 && "深夜2時。溢れ出した情緒をぶつけて。"}
              {step === 3 && "彼の浮気疑惑。釘を刺す決定的な一言。"}
            </div>
            <textarea
              className="w-full bg-transparent border border-gray-800 rounded-2xl p-4 text-white focus:outline-none focus:border-pink-500 min-h-[120px] transition-colors"
              placeholder="メッセージを入力..."
              value={step === 1 ? answers.q1 : step === 2 ? answers.q2 : answers.q3}
              onChange={(e) => handleInput(`q${step}`, e.target.value)}
            />
            <button
              onClick={() => step < 3 ? setStep(step + 1) : analyze()}
              className="w-full py-3 bg-white text-black rounded-2xl font-black disabled:opacity-20"
              disabled={!answers[`q${step}` as keyof typeof answers]}
            >
              {step < 3 ? "次へ進む" : "格付けを仰ぐ"}
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <div className="text-center py-20">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-pink-500 font-bold animate-pulse">精神を解析中...</p>
          </div>
        )}

        {step === 5 && result && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 text-center">
            {/* メイン格付け表示 */}
            <div className="space-y-2">
              <div className="text-sm text-purple-400 tracking-widest font-bold">GRADE</div>
              <div className="text-8xl font-black text-pink-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.6)] italic">
                {result.grade}
              </div>
              <div className="text-xl font-black text-white mt-2">
                {result.rank_name}
              </div>
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-block mt-4 bg-red-600/20 text-red-500 px-4 py-1 rounded-full border border-red-600/50 text-xs font-bold"
              >
                {result.warning}
              </motion.div>
            </div>

            {/* スコア・チャート */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-gray-900 p-2 rounded-xl border border-gray-800">
                <div className="text-[10px] text-gray-500">SCORE</div>
                <div className="text-lg font-bold">{result.score}</div>
              </div>
              <div className="bg-gray-900 p-2 rounded-xl border border-gray-800">
                <div className="text-[10px] text-gray-500">湿度</div>
                <div className="text-lg font-bold text-blue-400">{result.chart.humidity}%</div>
              </div>
              <div className="bg-gray-900 p-2 rounded-xl border border-gray-800">
                <div className="text-[10px] text-gray-500">圧</div>
                <div className="text-lg font-bold text-red-500">{result.chart.pressure}%</div>
              </div>
              <div className="bg-gray-900 p-2 rounded-xl border border-gray-800">
                <div className="text-[10px] text-gray-500">妄想</div>
                <div className="text-lg font-bold text-purple-400">{result.chart.delusion}%</div>
              </div>
            </div>

            {/* ハイライト */}
            <div className="text-left bg-white/5 p-4 rounded-2xl border-l-4 border-pink-500 quote">
              <p className="font-serif italic text-gray-200">"{result.highlight_quote}"</p>
            </div>

            {/* 総評 */}
            <p className="text-sm text-gray-400 leading-relaxed text-left px-2">
              {result.comment}
            </p>

            {/* レビューログ */}
            <div className="space-y-3 pt-6 border-t border-gray-800 text-left">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center">Execution Log</p>
              {result.short_reviews.map((rev, i) => (
                <div key={i} className="bg-gray-900/40 p-3 rounded-xl text-xs border border-gray-800/50">
                  <span className="text-gray-500 block mb-1">Q{i+1} Response</span>
                  <p className="text-pink-400 font-bold">{rev}</p>
                </div>
              ))}
            </div>

            <button 
              onClick={() => { setStep(0); setAnswers({q1:"", q2:"", q3:""}); }}
              className="text-xs text-gray-600 underline hover:text-white transition-colors"
            >
              再診断を受ける
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}