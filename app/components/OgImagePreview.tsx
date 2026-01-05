"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Share2 } from "lucide-react";

type Props = {
  id: string;
};

export default function OgImagePreview({ id }: Props) {
  const [loading, setLoading] = useState(true);
  
  // OGP画像のURL
  const imageUrl = `/api/og?id=${id}`;

  // 画像ダウンロード処理
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `menhera-diagnosis-${id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("画像の保存に失敗しました...");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-6 mb-8 space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold text-purple-400 tracking-widest">
          MENHERA KARTE
        </h3>
        <p className="text-[10px] text-purple-300">
          長押しまたはボタンで保存
        </p>
      </div>

      {/* カードプレビューエリア */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative group perspective-1000"
      >
        <div className="relative rounded-[20px] overflow-hidden shadow-2xl shadow-purple-200 border-4 border-white transform transition-transform duration-500 hover:scale-[1.02]">
          {/* 画像本体 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Diagnosis Result Card"
            className="w-full h-auto object-cover"
            onLoad={() => setLoading(false)}
          />

          {/* ロード中のスケルトン */}
          {loading && (
            <div className="absolute inset-0 bg-purple-100 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* リッチな光沢エフェクト（オーバーレイ） */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/10 pointer-events-none mix-blend-overlay"></div>
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        </div>
      </motion.div>

      {/* アクションボタン */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleDownload}
          className="flex-1 py-3 px-4 bg-white text-purple-600 border border-purple-200 rounded-xl font-bold text-sm shadow-sm hover:bg-purple-50 transition-colorsqk flex items-center justify-center gap-2"
        >
          <Download size={16} />
          画像を保存
        </button>
        {/* Web Share API (スマホ用) */}
        <button
          onClick={async () => {
             if (navigator.share) {
               try {
                 const response = await fetch(imageUrl);
                 const blob = await response.blob();
                 const file = new File([blob], "result.png", { type: "image/png" });
                 await navigator.share({
                   files: [file],
                 });
               } catch (e) {
                 console.log("Share failed", e);
               }
             } else {
               alert("ブラウザのメニューから画像を保存してください");
             }
          }}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Share2 size={16} />
          画像でシェア
        </button>
      </div>
    </div>
  );
}