"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Link as LinkIcon, Check, ChevronLeft, Send, Sparkles } from "lucide-react";
import OgImagePreview from "./components/OgImagePreview";
import TermsModal from "./components/TermsModal";

type ChatResult = {
  id: string;
  user_input: string;
  ai_reply: string;
  image_url: string;
};

const STORAGE_KEY = "menhera_chat_draft"; 

export default function DiagnosisClient() {
  const [step, setStep] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<ChatResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTerms, setShowTerms] = useState(false); 
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedInput = localStorage.getItem(STORAGE_KEY);
      if (savedInput) setUserInput(savedInput);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, userInput);
  }, [userInput, isLoaded]);

  const clearInput = () => {
    if (confirm("メッセージを消去しますか？")) {
      setUserInput("");
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    setStep(2);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: userInput }),
      });

      const data = await res.json();
      if (!data.id) throw new Error("API Error");

      setResult(data);
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("通信エラーが発生しました。");
      setStep(1); 
    }
  };

  const shareOnX = () => {
    if (!result) return;
    const text = `AIメンヘラ彼女が怖すぎた...\n#AIメンヘラ彼女\n`;
    const shareUrl = `${window.location.origin}/result/${result.id}`;
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(xUrl, "_blank");
  };

  const copyLink = () => {
    if (!result) return;
    const shareUrl = `${window.location.origin}/result/${result.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRestart = () => {
    setStep(1);
    setUserInput("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-[#f8f5ff] text-purple-900 flex flex-col items-center justify-center p-4 font-sans selection:bg-purple-200">
      <div className="w-full max-w-md bg-white/70 p-6 rounded-[2.5rem] border border-purple-100 shadow-2xl shadow-purple-200/50 backdrop-blur-xl relative min-h-[500px] flex flex-col">
        
        {/* ヘッダー */}
        <div className="relative mb-6 text-center shrink-0">
          {step > 0 && step < 3 && (
            <button
              onClick={() => setStep(step === 1 ? 0 : 1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-purple-300 p-2 hover:bg-purple-50 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          
          <h1 
            onClick={() => setStep(0)}
            className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-pink-400 inline-block cursor-pointer"
          >
            AIメンヘラ彼女<br/>
            <span className="text-[10px] font-bold text-purple-300 tracking-normal">AI Menhera GirlFriend</span>
          </h1>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 flex flex-col justify-center">
          
          {/* STEP 0: LP */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
              {/* ▼▼▼ ここを修正（長方形のデザインに戻しました） ▼▼▼ */}
              <div className="w-full overflow-hidden rounded-2xl shadow-md border-2 border-white/50">
                <img 
                  src="/banner.png" 
                  alt="Main Banner" 
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* ▲▲▲ 修正ここまで ▲▲▲ */}
              
              <div className="space-y-2">
                <p className="text-xs text-purple-400/80 leading-relaxed max-w-[260px] mx-auto">
                 <span className="block py-2">
                    <span className="inline-block animate-bounce-subtle text-base font-black tracking-tighter bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(255,182,193,0.5)]">
                     AIがあなたのメッセージに
                    </span>
                 </span>
                  <span className="block py-2">
                    <span className="inline-block animate-bounce-subtle text-base font-black tracking-tighter bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(255,182,193,0.5)]">
                     ♡かわいく猟奇的に♡
                    </span>
                 </span>
                  <span className="block py-2">
                    <span className="inline-block animate-bounce-subtle text-base font-black tracking-tighter bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(255,182,193,0.5)]">
                     返信します。
                    </span>
                 </span>
                </p>
              </div>

              <button 
                onClick={() => setStep(1)} 
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
              >
                AIにメッセージを送ってみる
                <Send size={18} />
              </button>
            </motion.div>
          )}

          {/* STEP 1: 入力 */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm font-bold text-purple-600">彼女にメッセージを送る</p>
                <p className="text-[10px] text-purple-400">「おはよう」「コンビニ行く」なんでもOK</p>
              </div>
              
              <div className="relative">
                <textarea
                  className="w-full bg-white border-2 border-purple-100 rounded-2xl p-4 text-purple-900 focus:outline-none focus:border-pink-300 min-h-[140px] transition-colors placeholder-purple-200 text-base shadow-sm pr-10 resize-none"
                  placeholder="例：今から飲み会行ってくるね！"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  maxLength={100} // ★追加：100文字制限
                />
                
                {userInput && (
                  <button
                    onClick={clearInput}
                    className="absolute top-3 right-3 text-purple-200 hover:text-pink-400 transition-colors p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center px-1">
                   {/* 左側のスペース埋め（必要なら何か入れる） */}
                   <span></span>
                   {/* 文字数カウント表示修正 */}
                   <span className={`text-[10px] font-bold ${userInput.length >= 100 ? "text-pink-500" : "text-purple-300"}`}>
                     {userInput.length} / 100 文字
                   </span>
                </div>

              <button
                onClick={sendMessage}
                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black disabled:opacity-30 disabled:grayscale transition-all shadow-md shadow-purple-100 flex items-center justify-center gap-2"
                disabled={!userInput}
              >
                <Sparkles size={18} />
                送信する
              </button>
            </motion.div>
          )}

          {/* STEP 2: ローディング */}
          {step === 2 && (
            <div className="text-center py-20 space-y-4">
              <div className="animate-spin inline-block w-10 h-10 border-[4px] border-purple-200 border-t-pink-500 rounded-full"></div>
              <p className="text-sm text-purple-400 font-bold animate-pulse">既読がつきました...</p>
              <p className="text-[10px] text-purple-300">入力中...</p>
            </div>
          )}

          {/* STEP 3: 結果 */}
          {step === 3 && result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* チャット風表示 */}
              <div className="space-y-4 bg-purple-50/50 p-4 rounded-[2rem] border border-purple-100">
                {/* ユーザー */}
                <div className="flex justify-end items-end gap-2">
                  <div className="bg-purple-200 text-purple-900 text-xs py-2 px-4 rounded-2xl rounded-br-none max-w-[80%] shadow-sm">
                    {result.user_input}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-purple-300 flex items-center justify-center text-[10px] text-white shrink-0">
                    Me
                  </div>
                </div>

                {/* AI */}
                <div className="flex justify-start items-end gap-2">
                  <img src={result.image_url} alt="AI" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
                  <div className="bg-white text-purple-900 text-sm font-bold py-3 px-4 rounded-2xl rounded-bl-none max-w-[85%] shadow-md border border-pink-100 leading-relaxed">
                    {result.ai_reply}
                  </div>
                </div>
              </div>

              {/* シェア・保存エリア */}
              <div className="space-y-4 pt-4 border-t border-purple-100">
                <OgImagePreview id={result.id} />
                
                <p className="text-[10px] text-center text-purple-400 font-medium">
                  かわいい彼女の返信をシェアしよう<br></br>
                  編集の時に画像が出なくても、送信したらちゃんと上の画像が出るからね
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={shareOnX}
                    className="flex-[2] py-3 bg-black text-white rounded-xl font-bold text-xs hover:opacity-80 transition-all flex items-center justify-center gap-2"
                  >
                    Xで共有
                  </button>
                   <button
                    onClick={copyLink}
                    className="flex-1 py-3 bg-white border border-purple-200 text-purple-400 rounded-xl font-bold hover:bg-purple-50 transition-all flex items-center justify-center"
                  >
                    <p>リンク</p>{copied ? <Check size={18} /> : <LinkIcon size={18} />}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleRestart}
                className="w-full text-xs text-purple-300 font-bold underline decoration-purple-100 underline-offset-4 hover:text-purple-400 transition-colors pt-4 pb-2"
              >
                別のメッセージを送る
              </button>
            </motion.div>
          )}
        </div>

        {/* フッターリンク */}
        <div className="mt-4 pt-4 border-t border-purple-50 text-center shrink-0">
          <button
            onClick={() => setShowTerms(true)}
            className="text-[10px] text-purple-300 hover:text-purple-500 transition-colors"
          >
            利用規約・データの扱い
          </button>
        </div>

        <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      </div>
    </main>
  );
}