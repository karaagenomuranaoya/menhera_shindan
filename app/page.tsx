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
    <main className="min-h-screen bg-[#f8f5ff] text-purple-900 flex flex-col items-center justify-center p-4 font-sans selection:bg-purple-200">
      <div className="w-full max-w-md bg-white/70 p-6 rounded-[2.5rem] border border-purple-100 shadow-2xl shadow-purple-200/50 backdrop-blur-xl">
        
        <h1 className="text-2xl font-black text-center mb-8 tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-pink-400">
          メンヘラ診断<br/><span className="text-xs font-bold text-purple-300 tracking-normal">Menhera Diagnosis</span>
        </h1>

        {step === 0 && (
          <div className="text-center space-y-6">
            <p className="text-purple-400/80 text-sm leading-relaxed font-medium">あなたの愛の重さを、<br/>メンヘラ界のカリスマが格付けします。</p>
            <button 
              onClick={() => setStep(1)} 
              className="w-full py-4 bg-gradient-to-r from-purple-400 to-pink-300 text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-200"
            >
              入室する
            </button>
          </div>
        )}

        {[1, 2, 3].includes(step) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="text-[10px] text-purple-400 font-black mb-1 tracking-tighter">QUESTION 0{step}</div>
            <div className="bg-purple-50/80 p-5 rounded-3xl rounded-tl-none text-sm border border-purple-100 text-purple-800 shadow-inner">
              {step === 1 && "彼から5時間返信がない。追いLINEするなら？"}
              {step === 2 && "深夜2時。溢れ出した情緒をぶつけて。"}
              {step === 3 && "彼の浮気疑惑。釘を刺す決定的な一言。"}
            </div>
            <textarea
              className="w-full bg-white/50 border border-purple-100 rounded-2xl p-4 text-purple-900 focus:outline-none focus:border-purple-300 min-h-[120px] transition-colors placeholder-purple-200 text-sm shadow-sm"
              placeholder="メッセージを入力..."
              value={step === 1 ? answers.q1 : step === 2 ? answers.q2 : answers.q3}
              onChange={(e) => handleInput(`q${step}`, e.target.value)}
            />
            <button
              onClick={() => step < 3 ? setStep(step + 1) : analyze()}
              className="w-full py-4 bg-purple-500 text-white rounded-2xl font-black disabled:opacity-30 disabled:grayscale transition-all shadow-md shadow-purple-100"
              disabled={!answers[`q${step}` as keyof typeof answers]}
            >
              {step < 3 ? "次へ進む" : "格付けを仰ぐ"}
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <div className="text-center py-20">
            <div className="animate-spin inline-block w-8 h-8 border-[3px] border-purple-300 border-t-purple-500 rounded-full mb-4"></div>
            <p className="text-purple-400 font-bold animate-pulse">精神を解析中...</p>
          </div>
        )}

        {step === 5 && result && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 text-center">
            {/* メイン格付け表示 */}
            <div className="space-y-2">
              <div className="text-[10px] text-purple-300 tracking-[0.2em] font-black">GRADE</div>
              <div className="text-8xl font-black text-pink-400 drop-shadow-[0_4px_10px_rgba(244,114,182,0.3)] italic">
                {result.grade}
              </div>
              <div className="text-xl font-black text-purple-800 mt-2">
                {result.rank_name}
              </div>
              <motion.div 
                animate={{ scale: [1, 1.03, 1] }} 
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="inline-block mt-4 bg-pink-50 text-pink-400 px-5 py-1.5 rounded-full border border-pink-100 text-xs font-bold"
              >
                {result.warning}
              </motion.div>
            </div>

            {/* スコア・チャート */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-purple-50/50 p-2 rounded-2xl border border-purple-100/50">
                <div className="text-[9px] text-purple-300 font-bold">SCORE</div>
                <div className="text-lg font-bold text-purple-600">{result.score}</div>
              </div>
              <div className="bg-purple-50/50 p-2 rounded-2xl border border-purple-100/50">
                <div className="text-[9px] text-purple-300 font-bold">湿度</div>
                <div className="text-lg font-bold text-blue-400">{result.chart.humidity}%</div>
              </div>
              <div className="bg-purple-50/50 p-2 rounded-2xl border border-purple-100/50">
                <div className="text-[9px] text-purple-300 font-bold">圧</div>
                <div className="text-lg font-bold text-red-400">{result.chart.pressure}%</div>
              </div>
              <div className="bg-purple-50/50 p-2 rounded-2xl border border-purple-100/50">
                <div className="text-[9px] text-purple-300 font-bold">妄想</div>
                <div className="text-lg font-bold text-purple-400">{result.chart.delusion}%</div>
              </div>
            </div>

            {/* ハイライト */}
            <div className="text-left bg-gradient-to-br from-pink-50/50 to-purple-50/50 p-5 rounded-[2rem] border-l-4 border-pink-300 quote shadow-sm">
              <p className="font-serif italic text-purple-700/80 text-sm leading-relaxed">"{result.highlight_quote}"</p>
            </div>

            {/* 総評 */}
            <p className="text-sm text-purple-800/70 font-medium leading-relaxed text-left px-2">
              {result.comment}
            </p>

            {/* レビューログ：回答とAIコメントをセットで表示 */}
            <div className="space-y-4 pt-6 border-t border-purple-100 text-left">
              <p className="text-[10px] font-black text-purple-200 uppercase tracking-widest text-center">Execution Log</p>
              {[1, 2, 3].map((num) => {
                const answerKey = `q${num}` as keyof typeof answers;
                return (
                  <div key={num} className="bg-white/40 p-3 rounded-2xl text-[11px] border border-purple-50 space-y-2">
                    <div>
                      <span className="text-purple-300 font-bold block mb-1">Your Answer {num}</span>
                      <p className="text-purple-800 whitespace-pre-wrap bg-purple-50/30 p-2 rounded-lg border border-purple-100/50">
                        {answers[answerKey]}
                      </p>
                    </div>
                    <div>
                      <span className="text-pink-300 font-bold block mb-0.5">AI Review</span>
                      <p className="text-pink-400 font-bold italic">{result.short_reviews[num - 1]}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => { setStep(0); setAnswers({q1:"", q2:"", q3:""}); }}
              className="text-xs text-purple-300 font-bold underline decoration-purple-100 underline-offset-4 hover:text-purple-400 transition-colors"
            >
              再診断を受ける
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}