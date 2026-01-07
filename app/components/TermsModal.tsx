"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ScrollText } from "lucide-react";

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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-900/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="bg-white/95 w-full max-w-sm max-h-[80vh] flex flex-col rounded-[2rem] shadow-2xl border border-purple-200 relative overflow-hidden"
          >
            {/* ヘッダー */}
            <div className="p-5 border-b border-purple-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2 text-purple-600 font-bold">
                <ScrollText size={18} />
                <span>ヒミツの約束（利用規約）</span>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-purple-300 hover:text-purple-500 transition-colors bg-white rounded-full shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* 本文エリア */}
            <div className="p-6 overflow-y-auto text-sm text-purple-900/80 space-y-4 leading-relaxed scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
              <p>
                「AI闇恋診断」（以下、当サービス）を利用するにあたり、以下の内容に同意したものとみなします。
              </p>

              <div className="space-y-2">
                <h4 className="font-bold text-purple-600 text-xs bg-purple-100/50 inline-block px-2 py-1 rounded">
                  1. データの将来的な利用について
                </h4>
                <p className="text-xs">
                  あなたが入力した回答データは、将来的に開発されるかもしれない<span className="font-bold text-pink-500">「最強の闇恋女子AI」</span>などの学習データとして活用させていただく場合があります。あなたの愛の重さが、AIの人格を形成する礎となります。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-purple-600 text-xs bg-purple-100/50 inline-block px-2 py-1 rounded">
                  2. コンテンツ化について
                </h4>
                <p className="text-xs">
                  入力された秀逸な回答は、個人を特定できない形で、本サービスに関連する書籍、記事、SNS投稿などで紹介させていただく場合があります。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-purple-600 text-xs bg-purple-100/50 inline-block px-2 py-1 rounded">
                  3. 個人情報の入力禁止
                </h4>
                <p className="text-xs">
                  回答欄には、実名、住所、電話番号などの<span className="font-bold text-red-400">個人情報は絶対に入力しないでください</span>。入力された情報により生じたトラブルについて、運営者は一切の責任を負いません。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-purple-600 text-xs bg-purple-100/50 inline-block px-2 py-1 rounded">
                  4. 免責事項
                </h4>
                <p className="text-xs">
                  本サービスはエンターテインメントを目的としたジョークアプリです。医学的診断やカウンセリングを提供するものではありません。
                </p>
              </div>
            </div>

            {/* フッター */}
            <div className="p-4 border-t border-purple-100 bg-white">
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-purple-400 to-pink-300 text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all"
              >
                理解しました
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}