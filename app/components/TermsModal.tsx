"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ScrollText, X } from "lucide-react";

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
							{/** biome-ignore lint/a11y/useButtonType: <explanation> */}
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
								「AI激重彼女」（以下、当サービス）を利用するにあたり、以下の内容に同意したものとみなします。
							</p>

							<div className="space-y-2">
								<h4 className="font-bold text-purple-600 text-xs bg-purple-100/50 inline-block px-2 py-1 rounded">
									1. AIによる生成コンテンツについて
								</h4>
								<p className="text-xs">
									本サービスはGoogle Gemini
									AIを使用しており、返信内容はAIが生成した架空のものです。過激な表現が含まれる場合がありますが、特定の個人を攻撃する意図はありません。
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-purple-600 text-xs bg-purple-100/50 inline-block px-2 py-1 rounded">
									2. データの公開・利用について
								</h4>
								<p className="text-xs">
									あなたが入力したメッセージと、それに対するAIの返答は、本サービス上で匿名で公開（共有）される機能を持っています。個人を特定できる情報（本名、住所、電話番号など）は
									<span className="font-bold text-red-400">
										絶対に入力しないでください
									</span>
									。
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-purple-600 text-xs bg-purple-100/50 inline-block px-2 py-1 rounded">
									3. 免責事項
								</h4>
								<p className="text-xs">
									本サービスはエンターテインメントを目的としたジョークアプリです。AIの回答によって生じた精神的苦痛やトラブルについて、運営者は一切の責任を負いません。
								</p>
							</div>
						</div>

						{/* フッター */}
						<div className="p-4 border-t border-purple-100 bg-white">
							{/** biome-ignore lint/a11y/useButtonType: <explanation> */}
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
