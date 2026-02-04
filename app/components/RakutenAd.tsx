"use client"; // ← ランダム処理のためにこれが必要です

import { ExternalLink, Gift } from "lucide-react";
import { useEffect, useState } from "react";

// ▼▼▼ ここにアイテムをどんどん追加していく ▼▼▼
const ITEMS = [
	// 1. AirTag
	{
		title: "【選べる専用ケース付】Apple AirTag",
		catchphrase: "これでいつでも居場所わかるね♡",
		linkUrl:
			"https://hb.afl.rakuten.co.jp/ichiba/50aad9a4.de883381.50aad9a5.2ee0469b/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fsea-story-kagoshima%2Fsea-story-4549995106589%2F&link_type=picttext&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJwaWN0dGV4dCIsInNpemUiOiIyNDB4MjQwIiwibmFtIjoxLCJuYW1wIjoicmlnaHQiLCJjb20iOjEsImNvbXAiOiJkb3duIiwicHJpY2UiOjEsImJvciI6MSwiY29sIjoxLCJiYnRuIjoxLCJwcm9kIjowLCJhbXAiOmZhbHNlfQ%3D%3D",
		imageUrl:
			"https://hbb.afl.rakuten.co.jp/hgb/50aad9a4.de883381.50aad9a5.2ee0469b/?me_id=1410335&item_id=10000427&pc=https%3A%2F%2Fthumbnail.image.rakuten.co.jp%2F%400_mall%2Fsea-story-kagoshima%2Fcabinet%2Fimgrc0094083081.jpg%3F_ex%3D240x240&s=240x240&t=picttext",
		price: "4,078円〜",
	},
	// 2. 南京錠（今回追加分）
	{
		title: "TSAロック ワイヤー南京錠 ダイヤル式",
		catchphrase: "二人の愛をロックしなきゃ♡ 外出禁止ね？",
		linkUrl:
			"https://hb.afl.rakuten.co.jp/ichiba/50aad743.14f65b9a.50aad744.8848caae/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Forange58%2Ftsa-w%2F&link_type=picttext&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJwaWN0dGV4dCIsInNpemUiOiIyNDB4MjQwIiwibmFtIjoxLCJuYW1wIjoicmlnaHQiLCJjb20iOjEsImNvbXAiOiJkb3duIiwicHJpY2UiOjEsImJvciI6MSwiY29sIjoxLCJiYnRuIjoxLCJwcm9kIjowLCJhbXAiOmZhbHNlfQ%3D%3D",
		imageUrl:
			"https://hbb.afl.rakuten.co.jp/hgb/50aad743.14f65b9a.50aad744.8848caae/?me_id=1246341&item_id=10000890&pc=https%3A%2F%2Fthumbnail.image.rakuten.co.jp%2F%400_mall%2Forange58%2Fcabinet%2F10040990%2Fimgrc0102275217.jpg%3F_ex%3D240x240&s=240x240&t=picttext",
		price: "698円〜",
	},
];

export default function RakutenAd() {
	// 初期値はnullにしておき、マウント後にランダム決定する（Hydration Error防止）
	const [item, setItem] = useState<(typeof ITEMS)[0] | null>(null);

	useEffect(() => {
		const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
		setItem(randomItem);
	}, []);

	if (!item) return null; // ロード前は何も表示しない

	return (
		<div className="w-full max-w-sm mx-auto mt-6 mb-8">
			{/* 以前と同じデザインコード */}
			<div className="relative bg-white/90 border-2 border-pink-300 rounded-2xl p-4 shadow-lg shadow-pink-100 overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
				<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400" />
				<div className="flex items-center justify-center gap-2 mb-3">
					<Gift size={16} className="text-pink-500 animate-bounce" />
					<span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
						彼女がアイテムを提案しています
					</span>
				</div>

				<a
					href={item.linkUrl}
					target="_blank"
					rel="nofollow sponsored noopener"
					className="flex items-start gap-4"
				>
					<div className="w-24 h-24 shrink-0 bg-white rounded-xl border border-purple-100 p-2 flex items-center justify-center shadow-sm">
						{/* biome-ignore lint/a11y/noAltText: <explanation> */}
						{/** biome-ignore lint/a11y/useAltText: <explanation> */}
						<img
							src={item.imageUrl}
							className="max-w-full max-h-full object-contain"
						/>
					</div>

					<div className="flex-1 min-w-0 py-1 space-y-2">
						<div>
							<p className="text-sm font-bold text-pink-600 leading-tight">
								{item.catchphrase}
							</p>
							<p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
								{item.title}
							</p>
						</div>

						<div className="flex items-center justify-between mt-2">
							<span className="text-xs font-bold text-gray-700">
								{item.price}
							</span>
							<span className="flex items-center gap-1 text-[10px] bg-red-500 text-white px-3 py-1.5 rounded-full font-bold shadow-md group-hover:bg-red-600 transition-colors">
								楽天で見る <ExternalLink size={10} />
							</span>
						</div>
					</div>
				</a>

				<div className="absolute top-2 right-2 text-[8px] text-gray-300 border border-gray-200 px-1 rounded">
					AD
				</div>
			</div>
		</div>
	);
}
