"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ScrollText, Check } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function TermsModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="bg-[#0a0000] w-full max-w-sm max-h-[85vh] flex flex-col rounded-sm shadow-[0_0_50px_rgba(255,0,0,0.2)] border border-red-900/50 relative overflow-hidden"
          >
            {/* ヘッダー */}
            <div className="p-5 border-b border-red-900/30 flex items-center justify-between bg-red-950/20">
              <div className="flex items-center gap-2 text-red-500 font-bold tracking-widest">
                <ScrollText size={18} />
                <span>利用規約</span>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-red-800 hover:text-red-500 transition-colors hover:bg-red-900/20 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* 本文エリア */}
            <div className="p-6 overflow-y-auto text-sm text-red-100/90 space-y-6 leading-relaxed scrollbar-thin scrollbar-thumb-red-900 scrollbar-track-transparent font-sans">
              <p className="text-xs text-gray-400">
                「AI狂愛コロシアム」（以下、本サービス）をご利用いただく前に、以下の規約を必ずご確認ください。
              </p>

              <div className="space-y-2">
                <h4 className="font-bold text-red-500 text-xs border-l-2 border-red-600 pl-2">
                  1. データの公開について
                </h4>
                <p className="text-xs">
                  本サービスに入力された回答および診断結果は、<span className="font-bold text-red-400">自動的にサイト内のランキング等で公開されます</span>。不特定多数のユーザーが閲覧可能な状態となることを予めご了承ください。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-red-500 text-xs border-l-2 border-red-600 pl-2">
                  2. 個人情報の入力禁止
                </h4>
                <p className="text-xs">
                  回答入力欄には、<span className="font-bold text-red-400">個人を特定できる情報（実名、住所、電話番号、SNSアカウント等）を絶対に入力しないでください</span>。入力された情報により生じたトラブルについて、運営者は一切の責任を負いません。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-red-500 text-xs border-l-2 border-red-600 pl-2">
                  3. データの利用について
                </h4>
                <p className="text-xs">
                  入力されたデータは、本サービスの改善、AIの学習データ、および関連コンテンツ（SNSでの紹介など）として利用させていただく場合があります。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-red-500 text-xs border-l-2 border-red-600 pl-2">
                  4. 免責事項
                </h4>
                <p className="text-xs">
                  本サービスはエンターテインメントを目的としたジョークアプリです。診断結果の正確性や、利用によって生じた損害について保証するものではありません。
                </p>
              </div>
            </div>

            {/* フッター */}
            <div className="p-4 border-t border-red-900/30 bg-black/50">
              <button
                onClick={onClose}
                className="group w-full py-3 bg-red-950 text-red-500 border border-red-900 rounded-sm font-bold text-sm hover:bg-red-600 hover:text-white hover:border-red-500 transition-all tracking-widest flex items-center justify-center gap-2"
              >
                <Check size={16} />
                同意して閉じる
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}