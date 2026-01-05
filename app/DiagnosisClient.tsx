"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Link as LinkIcon, Check, HelpCircle, Copy, X } from "lucide-react";
import OgImagePreview from "./components/OgImagePreview";

// 質問の候補リスト
const QUESTION_CANDIDATES = [
  "彼から5時間返信がない。追いLINEするなら？",
  "深夜2時。溢れ出した情緒をそのままメッセージにしてぶつけて。",
  "彼の浮気疑惑。釘を刺す決定的な一言をどうぞ。",
  "彼が他の女の子の投稿に「いいね」してた。どう詰める？",
  "「もう疲れた」と言われた時の、彼を逃がさないための一言。"
];

type DiagnosisResult = {
  id: string;
  score: number;
  grade: "SSS" | "SS" | "S" | "A" | "B" | "C" | "D" | "E";
  rank_name: string;
  warning: string;
  image_url: string;
  comment: string;
};

const STORAGE_KEY = "menhera_diagnosis_draft"; 

export default function DiagnosisClient() {
  const [step, setStep] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [copied, setCopied] = useState(false);
  
  // 安全装置：初期ロード完了フラグ
  const [isLoaded, setIsLoaded] = useState(false);

  // ヒント機能用ステート
  const [showHint, setShowHint] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [randomLevel, setRandomLevel] = useState(80);

  // 初回ロード時にローカルストレージから復元
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAnswer = localStorage.getItem(STORAGE_KEY);
      if (savedAnswer) {
        setAnswer(savedAnswer);
      }
      setIsLoaded(true); // 読み込み完了！
    }
  }, []);

  // 読み込み完了後のみ、変更を保存（これで消失を防ぐ）
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, answer);
    }
  }, [answer, isLoaded]);

  useEffect(() => {
    if (step === 0) {
      const randomIdx = Math.floor(Math.random() * QUESTION_CANDIDATES.length);
      setSelectedQuestion(QUESTION_CANDIDATES[randomIdx]);
    }
  }, [step]);

  const openHint = () => {
    setRandomLevel(Math.floor(Math.random() * 100) + 20);
    setShowHint(true);
  };

  const hintPrompt = `あなたはメンヘラ女子です。
以下のお題に対して，指定されたメンヘラ度の強さで、60文字程度で答えを考えてください。

お題：${selectedQuestion}
メンヘラ度：${randomLevel}%

では，お願いします。`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(hintPrompt).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    });
  };

  const clearAnswer = () => {
    if (confirm("入力内容をすべて消去しますか？")) {
      setAnswer("");
      localStorage.removeItem(STORAGE_KEY);
    }
  };

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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || "サーバーエラー");
      }

      const data = await res.json();
      
      if (!data || !data.grade) {
        throw new Error("データ形式が不正です");
      }

      setResult(data);
      setStep(3);
    } catch (e: any) {
      console.error("Diagnosis Error:", e);
      alert("診断中にエラーが発生しました。\n入力内容はそのまま残してあるので、時間をおいてもう一度試してみてね。");
      setStep(1); 
    }
  };

  const shareOnX = () => {
    if (!result) return;
    const text = `AIメンヘラ診断：結果は【${result.grade}ランク】でした\n#AIメンヘラ診断\n`;
    const shareUrl = `${window.location.origin}/result/${result.id}`;
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(xUrl, "_blank");
  };

  const shareOnLine = () => {
    if (!result) return;
    const text = `AIメンヘラ診断：結果は【${result.grade}ランク】でした`;
    const shareUrl = `${window.location.origin}/result/${result.id}`;
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(lineUrl, "_blank");
  };

  const copyLink = () => {
    if (!result) return;
    const shareUrl = `${window.location.origin}/result/${result.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 【修正】ここです！勝手に消さないようにしました。
  const handleRestart = () => {
    setStep(0);
    // setAnswer("");  ← 削除
    // localStorage.removeItem(STORAGE_KEY); ← 削除
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-[#f8f5ff] text-purple-900 flex flex-col items-center justify-center p-4 font-sans selection:bg-purple-200">
      <div className="w-full max-w-md bg-white/70 p-6 rounded-[2.5rem] border border-purple-100 shadow-2xl shadow-purple-200/50 backdrop-blur-xl relative">
        
        <h1 className="text-2xl font-black text-center mb-8 tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-pink-400">
          AIメンヘラ診断<br/><span className="text-xs font-bold text-purple-300 tracking-normal">AI Menhera Check</span>
        </h1>

        {step === 0 && (
          <div className="text-center space-y-6">
            <div className="w-full overflow-hidden rounded-2xl shadow-md border-2 border-white/50">
              <img 
                src="/banner.png" 
                alt="Main Banner" 
                className="w-full h-auto object-cover"
              />
            </div>
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
            
            <div className="relative">
              <textarea
                className="w-full bg-white/50 border border-purple-100 rounded-2xl p-4 text-purple-900 focus:outline-none focus:border-purple-300 min-h-[120px] transition-colors placeholder-purple-200 text-sm shadow-sm pr-10"
                placeholder="メッセージを入力..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              
              {answer && (
                <button
                  onClick={clearAnswer}
                  className="absolute top-3 right-3 text-purple-200 hover:text-pink-400 transition-colors p-1"
                  title="全消去"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button 
                onClick={openHint}
                className="text-[10px] text-purple-400 flex items-center gap-1 hover:underline hover:text-purple-600 transition-colors"
              >
                <HelpCircle size={14} />
                思いつかない...
              </button>

              <span className="text-[10px] text-purple-300 font-bold">
                {answer.length} 文字の愛
              </span>
            </div>

            <button
              onClick={() => analyze()}
              className="w-full py-4 bg-purple-500 text-white rounded-2xl font-black disabled:opacity-30 disabled:grayscale transition-all shadow-md shadow-purple-100"
              disabled={!answer}
            >
              診断する
            </button>
          </motion.div>
        )}

        {/* お助けモーダル */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowHint(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-sm p-6 rounded-[2rem] shadow-2xl border border-purple-100 relative"
              >
                <button 
                  onClick={() => setShowHint(false)}
                  className="absolute top-4 right-4 text-purple-300 hover:text-purple-500 p-2"
                >
                  <X size={20} />
                </button>

                <h3 className="text-center text-purple-600 font-bold mb-4">
                  他のお友達(AI)に<br/>聞いてみる？
                </h3>
                
                <p className="text-xs text-purple-800/80 mb-4 leading-relaxed">
                  思いつかないの？なら、この文章を<span className="font-bold text-pink-500">ChatGPT</span>とか<span className="font-bold text-pink-500">Gemini</span>のお友達に送って、書いてもらうといいわよ。
                </p>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-xs text-purple-700 font-mono mb-4 whitespace-pre-wrap relative group">
                  {hintPrompt}
                  
                  <button 
                    onClick={copyPrompt}
                    className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-sm border border-purple-100 text-purple-400 hover:text-pink-500 transition-colors"
                  >
                    {promptCopied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="text-center text-[10px] text-purple-300 font-bold animate-pulse">
                  待ってるね。
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
              <div className="text-[clamp(2rem,12vw,3.75rem)] font-black text-pink-400 drop-shadow-[0_4px_10px_rgba(244,114,182,0.3)] italic mt-2 whitespace-nowrap leading-none">
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
                  src={result.image_url} 
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
              <div className="text-center mb-4">
                <div className="text-[clamp(1.8rem,10vw,3.75rem)] font-black text-pink-400 drop-shadow-[0_4px_10px_rgba(244,114,182,0.3)] italic whitespace-nowrap leading-none">
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

            {/* 画面下部エリア：カードプレビュー＆共有ボタン */}
            <div className="border-t border-purple-100 pt-6 space-y-6">
              
              <OgImagePreview id={result.id} />

              <div className="space-y-3">
                <p className="text-[10px] text-purple-400/80 mb-2 font-medium">
                  ※作成画面で画像が出なくても、投稿すれば表示されます
                </p>

                <button
                  onClick={shareOnX}
                  className="w-full py-4 bg-[#0f1419] text-white rounded-2xl font-black hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Xで結果を共有する
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={shareOnLine}
                    className="flex-[2] py-4 bg-[#06C755] text-white rounded-2xl font-black hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">LINE</span>
                    友達に教える
                  </button>
                  
                  <button
                    onClick={copyLink}
                    className="flex-1 py-4 bg-white border-2 border-purple-100 text-purple-400 rounded-2xl font-bold hover:bg-purple-50 transition-all shadow-sm flex items-center justify-center gap-1 active:scale-95"
                  >
                    {copied ? <Check size={20} /> : <LinkIcon size={20} />}
                    <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={handleRestart}
              className="text-xs text-purple-300 font-bold underline decoration-purple-100 underline-offset-4 hover:text-purple-400 transition-colors pt-8 pb-4"
            >
              再診断を受ける
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}