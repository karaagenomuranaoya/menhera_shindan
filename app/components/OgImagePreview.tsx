"use client";

import { motion } from "framer-motion";
import { Download, Sparkles } from "lucide-react"; // Sparkles（キラキラ）を追加すると可愛いです
import { useState } from "react";

type Props = {
	id: string;
};

export default function OgImagePreview({ id }: Props) {
	const [loading, setLoading] = useState(true);

	// OGP画像のURL
	const imageUrl = `/api/og?id=${id}`;

	return (
		<div className="w-full max-w-lg mx-auto mt-6 mb-8 space-y-6">
			<div className="text-center space-y-3">
				<h3 className="text-sm font-bold text-purple-400 tracking-widest">
					Gekiomo Reply
				</h3>

				{/* --- ここを変更: 目立つアニメーション付きバッジ --- */}
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.4, type: "spring" }}
					className="relative inline-block"
				>
					<motion.div
						// ふわふわ動くアニメーション
						animate={{ y: [0, -4, 0] }}
						transition={{
							duration: 2,
							repeat: Infinity,
							ease: "easeInOut",
						}}
						className="flex items-center gap-2 bg-white/90 border-2 border-purple-300 px-4 py-2 rounded-full shadow-lg shadow-purple-200/50 mx-auto"
					>
						{/* アイコンで直感的に伝える */}
						<Download className="w-4 h-4 text-purple-500 animate-bounce" />
						<p className="text-xs font-bold text-purple-600">
							画像の左側を長押しして保存してね♡
						</p>
					</motion.div>
				</motion.div>
				{/* ------------------------------------------- */}
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

					{/* リッチな光沢エフェクト */}
					<div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/10 pointer-events-none mix-blend-overlay"></div>
					<div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
				</div>
			</motion.div>
		</div>
	);
}
