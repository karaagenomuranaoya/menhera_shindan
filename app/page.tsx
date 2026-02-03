import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import DiagnosisClient from "./DiagnosisClient";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
	searchParams,
}: Props): Promise<Metadata> {
	const { id } = await searchParams;
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	const defaultMetadata = {
		title: "AI 激重彼女",
		description:
			"あなたの何気ないメッセージに、激重AIが♡かわいく猟奇的に♡返信します。",
		openGraph: {
			title: "AI 激重彼女",
			description: "AIが愛と恐怖をあなたにぶつけます。",
			// ▼▼▼ 修正: ogp.png を参照するように変更 ▼▼▼
			images: [`${baseUrl}/ogp.png`],
		},
		// ▼▼▼ 推奨: Twitterカード用も設定しておくとXでのシェア時に反映されます ▼▼▼
		twitter: {
			card: "summary_large_image",
			title: "AI 激重彼女",
			description: "AIが愛と恐怖をあなたにぶつけます。",
			images: [`${baseUrl}/ogp.png`],
		},
	};

	if (!id || typeof id !== "string") return defaultMetadata;

	// IDがある場合はその結果をOGPにする
	const { data } = await supabase
		.from("menhera_chats")
		.select("*")
		.eq("id", id)
		.single();
	if (!data) return defaultMetadata;

	const ogUrl = new URL("/api/og", baseUrl);
	ogUrl.searchParams.set("id", id);

	return {
		title: "AI 激重彼女",
		description: `彼女からの返信: ${data.ai_reply.substring(0, 50)}...`,
		openGraph: {
			title: "AI 激重彼女",
			description: data.ai_reply,
			images: [ogUrl.toString()],
		},
		twitter: {
			card: "summary_large_image",
			title: "AI 激重彼女",
			description: data.ai_reply,
			images: [ogUrl.toString()],
		},
	};
}

export default function Home() {
	return <DiagnosisClient />;
}
