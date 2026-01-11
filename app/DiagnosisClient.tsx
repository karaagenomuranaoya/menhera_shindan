"use client";
import { useState, useEffect } from "react";
import Link from "next/link"; 
import RankingList from './components/RankingList';
// 型定義のみインポート（動作コードはインポートしない）
import type { RankingItem } from './lib/ranking'; 
import { motion } from "framer-motion";
import { Trash2, Link as LinkIcon, Check, Skull, Dices, ChevronLeft, Flame, Trophy, Quote, FileText, Crown } from "lucide-react"; 
import OgImagePreview from "./components/OgImagePreview";
import TermsModal from "./components/TermsModal";
import { getGachaResult } from "./data/gacha-presets";

type DiagnosisResult = {
  id: string;
  score: number;
  grade: "GOD" | "S" | "A" | "B" | "C" | "Error";
  title: string;
  pick_up_phrase: string;
  image_url: string;
  comment: string;
};

const STORAGE_KEY = "yamikoi_diagnosis_draft"; 

// Propsの型定義を追加
type Props = {
  initialRankings: RankingItem[];
};

// propsを受け取るように変更
export default function DiagnosisClient({ initialRankings }: Props) {
  const [step, setStep] = useState(1);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTerms, setShowTerms] = useState(false); 
  const [isLoaded, setIsLoaded] = useState(false);

  const handleGacha = () => {
    const randomText = getGachaResult();
    setAnswer(randomText);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 50, 50]); 
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAnswer = localStorage.getItem(STORAGE_KEY);
      if (savedAnswer) {
        setAnswer(savedAnswer);
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, answer);
    }
  }, [answer, isLoaded]);

  const clearAnswer = () => {
    if (confirm("入力データを消去しますか？")) {
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
          question: "固定", 
          answer: answer 
        }),
      });

      const data = await res.json();

      if (!data || !data.grade) {
        throw new Error("データ形式が不正です");
      }

      setResult(data);
      setStep(3);
    } catch (e: any) {
      console.error("Diagnosis Error:", e);
      alert("通信エラーが発生しました。\n愛が重すぎてサーバーがダウンした可能性があります。");
      setStep(1); 
    }
  };

  const shareOnX = () => {
    if (!result) return;
    const text = `私の狂気称号は【${result.title}】\nスコア: ${result.score.toLocaleString()}点\n#AI狂愛コロシアム\n`;
    const shareUrl = `${window.location.origin}/result/${result.id}`;
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(xUrl, "_blank");
  };

  const shareOnLine = () => {
    if (!result) return;
    const text = `私の狂気称号は【${result.title}】\nスコア: ${result.score.toLocaleString()}点`;
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

  const handleRestart = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-black text-red-600 flex flex-col items-center justify-start p-4 font-sans overflow-x-hidden relative pb-20">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20 bg-[url('/noise.png')] mix-blend-overlay"></div>
      
      {/* 診断カード */}
      <div className="w-full max-w-md bg-black/80 p-6 rounded-sm border border-red-900/50 shadow-[0_0_50px_rgba(255,0,0,0.2)] backdrop-blur-md relative z-10 mt-8 mb-8">
        
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-600"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-600"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-600"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-600"></div>

        <div className="relative mb-6 text-center">
          {step > 1 && (
            <button
              onClick={() => setStep(1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-red-800 hover:text-red-500 p-2 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          
          <h1 
            onClick={() => setStep(1)}
            className={`text-2xl font-black tracking-widest text-red-600 glitch-hover inline-block cursor-pointer`}
            style={{ textShadow: '0 0 10px rgba(255,0,0,0.5)' }}
          >
            AI狂愛<span className="text-white">×</span>コロシアム
          </h1>
          <p className="text-[9px] font-mono text-red-900 tracking-[0.5em] mt-1">MADNESS LOVE COLISEUM</p>
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            
            <div className="flex justify-center -mt-2 mb-4">
              <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full border-4 border-red-900 shadow-[0_0_40px_rgba(255,0,0,0.3)] overflow-hidden group">
                <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-20 transition-opacity z-10 animate-pulse"></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/A.png" 
                  alt="Judge" 
                  className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700 contrast-125"
                />
              </div>
            </div>

            <div className="bg-red-950/30 p-5 border-l-4 border-red-700 text-red-100 shadow-inner font-bold font-serif text-center text-lg leading-relaxed relative">
              <div className="absolute -top-3 left-3 bg-black text-red-600 text-[10px] font-black px-2 border border-red-900">THEME</div>
              うふふ。<br/>
              どんな
              <span className="inline-block mx-1 relative group cursor-help">
                <ruby className="ruby-position-over">
                  狂気
                  <rt className="text-[10px] text-red-500 font-sans tracking-tighter">アイ</rt>
                </ruby>
              </span>
              を<br/>
              聞かせてくれるの？
            </div>
            
            <div className="relative group">
              <textarea
                className="w-full bg-black border border-red-900/50 rounded-sm p-4 text-red-100 focus:outline-none focus:border-red-500 focus:bg-red-950/10 min-h-[150px] transition-all placeholder-red-900/50 text-sm shadow-inner pr-10 font-mono"
                placeholder="ここに遺言（回答）を刻め... 長文ほどAIが歓喜するかも？"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <div className="absolute inset-0 border border-red-600 opacity-0 group-hover:opacity-20 pointer-events-none transition-opacity duration-500 animate-pulse"></div>
              
              {answer && (
                <button
                  onClick={clearAnswer}
                  className="absolute top-3 right-3 text-red-900 hover:text-red-500 transition-colors p-1"
                  title="破棄"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <button
              onClick={handleGacha}
              className="w-full py-3 bg-black border border-red-800 text-red-600 font-bold text-xs hover:bg-red-900/20 hover:border-red-500 transition-all flex items-center justify-center gap-2 group shadow-[0_0_10px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,0,0,0.3)]"
            >
              <Dices size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              お手本ガチャ
            </button>

            <div className="flex justify-end items-center">
              <span className="text-[10px] text-red-800 font-mono">
                {answer.length} CHARACTERS
              </span>
            </div>

            <button
              onClick={() => analyze()}
              className="w-full py-4 bg-red-900/80 text-black border border-red-600 font-black hover:bg-red-600 hover:text-white transition-all shadow-[0_0_15px_rgba(255,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,0,0,0.6)] disabled:opacity-30 disabled:shadow-none tracking-widest text-lg"
              disabled={!answer}
            >
              アイを叫ぶ
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-red-900 border-t-red-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Skull size={24} className="text-red-900 animate-pulse" />
              </div>
            </div>
            <p className="text-red-600 font-bold mt-8 tracking-widest animate-pulse text-xl">お友達になれるかな...</p>
          </div>
        )}

        {step === 3 && result && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 text-center">
            {/* 上部：グレード画像と称号 */}
            <div className="space-y-4 relative">
              <div className="text-[10px] text-red-800 tracking-[0.5em] font-black border-b border-red-900 inline-block px-4 pb-1">RESULT</div>
              
              <div className="text-[clamp(3rem,12vw,4.5rem)] font-black text-red-600 drop-shadow-[0_0_15px_rgba(255,0,0,0.6)] italic mt-2 whitespace-nowrap leading-none glitch-hover">
                Rank:{result.grade}
              </div>
              
              <div className="relative w-64 h-64 mx-auto mt-4 group">
                <div className="absolute inset-0 bg-red-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                <div className="absolute inset-0 border-2 border-red-600/30 z-20 pointer-events-none"></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={result.image_url} 
                  alt={result.grade}
                  className="relative w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-500"
                />
              </div>

              {/* 称号 (Title) */}
              <div className="mt-4">
                <span className="text-[10px] text-red-500 block mb-1">YOUR TITLE</span>
                <div className="text-2xl font-black text-white tracking-wider leading-tight text-shadow-blood">
                  {result.title}
                </div>
              </div>
            </div>

            {/* スコア・抜粋・全文・コメント */}
            <div className="space-y-6 text-left px-2 border-t border-red-900/30 pt-6">
              
              {/* スコア */}
              <div className="text-center mb-6">
                <div className="text-xs text-red-900 font-mono tracking-widest mb-1 flex items-center justify-center gap-1">
                  <Trophy size={12} /> TOTAL SCORE
                </div>
                <div className="text-[clamp(2.5rem,8vw,4rem)] font-black text-red-600 italic font-mono leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">
                  {result.score.toLocaleString()}
                </div>
              </div>

              {/* キラーフレーズ */}
              <div className="bg-red-950/20 p-6 border border-red-900/50 relative overflow-hidden group">
                <Quote size={24} className="absolute top-2 left-2 text-red-900/50 rotate-180" />
                <div className="absolute top-0 right-0 bg-red-900 text-black text-[9px] font-black px-2 py-1 tracking-tighter">PICK UP MADNESS</div>
                <p className="text-xl text-white font-black leading-snug text-center pt-2 font-serif italic opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-md">
                  {result.pick_up_phrase}
                </p>
                <Quote size={24} className="absolute bottom-2 right-2 text-red-900/50" />
              </div>

              {/* 全文表示 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-black text-red-800 uppercase tracking-widest">
                  <FileText size={10} /> Your LOVE
                </div>
                <div className="bg-black/50 p-4 border border-red-900/30 text-xs text-red-300/60 font-mono leading-relaxed break-words whitespace-pre-wrap shadow-inner">
                  {answer}
                </div>
              </div>

              {/* AIコメント */}
              <div className="space-y-2 mt-4">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block">Review</span>
                <p className="text-sm text-red-200/90 font-medium leading-relaxed font-serif">
                  {result.comment}
                </p>
              </div>
            </div>

            {/* シェア・保存エリア */}
            <div className="border-t border-red-900/30 pt-6 space-y-6">
              <OgImagePreview id={result.id} />
              <div className="space-y-3">
                <p className="text-[10px] text-red-800 mb-2 font-mono">よかったら広めてね。</p>
                <button onClick={shareOnX} className="w-full py-4 bg-black text-white border border-white/20 rounded-sm font-black hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  Xで共有
                </button>
                <div className="flex gap-2">
                  <button onClick={shareOnLine} className="flex-[2] py-4 bg-[#06C755] text-white rounded-sm font-black hover:opacity-80 transition-all flex items-center justify-center gap-2">
                    <span className="text-lg font-bold">LINE</span>で共有
                  </button>
                  <button onClick={copyLink} className="flex-1 py-4 bg-black border border-red-900 text-red-500 rounded-sm font-bold hover:bg-red-900/20 transition-all flex items-center justify-center gap-1 active:scale-95">
                    {copied ? <Check size={20} /> : <LinkIcon size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button onClick={handleRestart} className="text-xs text-red-900 font-bold hover:text-red-500 transition-colors pt-8 pb-4 tracking-widest flex items-center justify-center gap-2 mx-auto group">
              <Flame size={12} className="group-hover:text-red-500 transition-colors" />
              リトライ
              <Flame size={12} className="group-hover:text-red-500 transition-colors" />
            </button>
          </motion.div>
        )}

        <div className="mt-8 pt-4 border-t border-red-900/30 text-center">
          <button
            onClick={() => setShowTerms(true)}
            className="text-[10px] text-red-900 hover:text-red-600 underline decoration-dotted underline-offset-2 transition-colors"
          >
            利用規約
          </button>
        </div>
      </div>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />

      {/* --- ランキングエリア（ステップ2以外で表示） --- */}
      {step !== 2 && (
        <div className="w-full max-w-md relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex items-center justify-between border-b border-red-900/50 pb-2 px-2">
            <h2 className="text-sm font-black text-red-500 tracking-widest flex items-center gap-2">
              <Crown size={16} className="text-red-600" />
              DAILY TOP 5
            </h2>
            <Link href="/ranking" className="text-[10px] text-red-800 hover:text-red-500 underline decoration-dotted">
              すべて見る
            </Link>
          </div>
          
          <RankingList rankings={initialRankings} limit={5} />
        </div>
      )}

    </main>
  );
}