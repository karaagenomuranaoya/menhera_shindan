import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import Link from "next/link";
import OgImagePreview from "../../components/OgImagePreview";

type Props = {
	params: Promise<{ id: string }>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ▼▼▼ 1. この整形用関数を追加してください ▼▼▼
const formatReply = (text: string) => {
	// [[...]] の部分を削除して前後の空白を取り除く
	return text.replace(/\[\[.*?\]\]/g, "").trim();
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	// ... (generateMetadataの中身は変更なしでOK)
	const { id } = await params;
	// ...
	// ※メタデータの説明文にも [[ ]] が出ないようにしたい場合は、
	// ここでも formatReply(data.ai_reply) を使うとより丁寧です。
	return {
		// ...
	};
}

export default async function ResultPage({ params }: Props) {
	const { id } = await params;
	const { data: result, error } = await supabase
		.from("menhera_chats")
		.select("*")
		.eq("id", id)
		.single();

	if (error || !result) {
		// ... (エラー表示部分はそのまま)
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f8f5ff]">
				<p className="text-purple-400 font-bold mb-4">
					結果が見つかりませんでした。
				</p>
				<Link href="/" className="text-purple-500 underline">
					トップへ戻る
				</Link>
			</div>
		);
	}

	return (
		<main className="min-h-screen bg-[#f8f5ff] text-purple-900 flex flex-col items-center justify-center p-4 font-sans">
			<div className="w-full max-w-md bg-white/70 p-6 rounded-[2.5rem] border border-purple-100 shadow-2xl shadow-purple-200/50 backdrop-blur-xl space-y-8 relative overflow-hidden">
				{/* ... (ヘッダーなどはそのまま) ... */}

				{/* チャット表示 */}
				<div className="space-y-6">
					{/* ユーザー */}
					<div className="flex justify-end items-end gap-2">
						<div className="space-y-1 text-right max-w-[80%]">
							<span className="text-[10px] text-purple-300 font-bold mr-1">
								YOU
							</span>
							<div className="bg-purple-100 text-purple-900 text-sm py-3 px-4 rounded-2xl shadow-sm text-left">
								{result.user_input}
							</div>
						</div>
					</div>

					{/* AI */}
					<div className="flex justify-start items-end gap-3">
						<div className="flex flex-col items-center gap-1 shrink-0">
							<img
								src={result.image_url}
								alt="AI"
								className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
							/>
							<span className="text-[10px] text-purple-300 font-bold">HER</span>
						</div>
						<div className="bg-white text-purple-900 text-base font-bold py-4 px-5 rounded-2xl shadow-md border-2 border-pink-50 leading-relaxed max-w-[85%] relative">
							{/* ▼▼▼ 2. ここを修正: formatReply() で囲む ▼▼▼ */}
							{formatReply(result.ai_reply)}
							{/* ▲▲▲ 修正ここまで ▲▲▲ */}

							<div className="absolute -top-2 -left-2 text-2xl"></div>
						</div>
					</div>
				</div>
{/* ▼ 追加: OGP画像プレビューエリア（区切り線を追加して配置） */}
				<div className="border-t border-purple-100 pt-4">
					<OgImagePreview id={result.id} />
				</div>

				<div className="pt-2 space-y-3">
					<p className="text-xs text-center text-purple-400 font-bold">
						あなたの言葉も聞いてみたいな♡
					</p>
					<Link
						href="/"
						className="block w-full py-4 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-2xl font-black hover:opacity-90 transition-all shadow-lg text-center animate-pulse"
					>
						自分も試してみる
					</Link>
				</div>
			</div>
		</main>
	);
}