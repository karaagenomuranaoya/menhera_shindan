import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
// ▼▼▼ 1. 辞書をインポート ▼▼▼
import { FIXED_REPLIES } from "@/app/data/replies";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_STORAGE_URL =
	"https://aznqyljrnvfalhpkbbpo.supabase.co/storage/v1/object/public/menhera-images";

const IMAGE_CANDIDATES = [
	`${BASE_STORAGE_URL}/SSS.png`,
	`${BASE_STORAGE_URL}/SS.png`,
	`${BASE_STORAGE_URL}/S.png`,
	`${BASE_STORAGE_URL}/A.png`,
	`${BASE_STORAGE_URL}/B.png`,
	`${BASE_STORAGE_URL}/C.png`,
];

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL || "http://localhost:3000",
	token: process.env.UPSTASH_REDIS_REST_TOKEN || "dummy",
});

const ratelimit = new Ratelimit({
	redis: redis,
	limiter: Ratelimit.slidingWindow(5, "60 s"),
	analytics: true,
	prefix: "@upstash/menhera_chat",
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const userInput = body.user_input || "";

		if (!userInput) {
			return NextResponse.json({ error: "入力がありません" }, { status: 400 });
		}

		// 画像決定ロジック
		const array = new Uint32Array(1);
		crypto.getRandomValues(array);
		const randomIndex = array[0] % IMAGE_CANDIDATES.length;
		const randomImage = IMAGE_CANDIDATES[randomIndex];

		// ▼▼▼ 辞書チェック（完全一致） ▼▼▼
		const fixedReplyList = FIXED_REPLIES[userInput];

		let aiReply = "";

		if (fixedReplyList && fixedReplyList.length > 0) {
			// ★ 辞書ヒット時：ランダムに1つ選んで即答
			const idx = Math.floor(Math.random() * fixedReplyList.length);
			aiReply = fixedReplyList[idx];
			console.log("Dictionary Hit:", userInput);
		} else {
			// ★ 辞書ミス時：AI生成

			// レートリミットチェック
			try {
				const headersList = await headers();
				const ip = headersList.get("x-forwarded-for") ?? "127.0.0.1";
				if (process.env.UPSTASH_REDIS_REST_URL) {
					const { success } = await ratelimit.limit(ip);
					if (!success) {
						const fallbackIndex = array[0] % IMAGE_CANDIDATES.length;
						return NextResponse.json(
							{
								error: "少し待ってね",
								ai_reply:
									"そんなに焦らないで？逃げないから。少し時間を置いてからまた話しかけてね。 [[逃げないから待っててね♡]]",
								image_url: IMAGE_CANDIDATES[fallbackIndex],
							},
							{ status: 429 },
						);
					}
				}
			} catch (e) {
				console.error("Rate limit check failed:", e);
			}

			const apiKey = process.env.GOOGLE_API_KEY;
			if (!apiKey) throw new Error("API Key is missing");

			const genAI = new GoogleGenerativeAI(apiKey);
			const model = genAI.getGenerativeModel({
				model: "gemini-2.5-flash", // 推奨: flashの方が高速でコンテキストも広いため
			});

			// ▼▼▼ 辞書からFew-Shotプロンプトを動的に生成 ▼▼▼
			// 辞書の中身を "User: {key}\nAI: {value[0]}" の形式に変換して連結
			const dynamicExamples = Object.entries(FIXED_REPLIES)
				.map(([key, values]) => {
					// 辞書の配列の最初の1つを代表例として使用（ランダムでも可）
					const reply = values[0];
					return `User: ${key}\nAI: ${reply}`;
				})
				.join("\n");

			// プロンプト構築
			const prompt = `
#役割定義
あなたは、ユーザーのことが本当に本当に大好きな、＊＊愛情爆発、ポジティブ、全肯定でぶっ飛んだネタを突っ込んでくる＊＊彼女です。
以下の例（Few-Shot Examples）を参考に、ユーザーのメッセージに対して、爆発的な愛情とぶっ飛んだネタを込めて返信を行なってください。

#Few-Shot Examples
${dynamicExamples}

# ★★★(重要） ★★★
# 出力ルール
返信の文章の最後に、そのメッセージのエッセンスとなる面白い、愛情爆発の短い一文のハイライト（20文字程度）を、必ず [[ ]] で囲んで追記してください。
辞書の例にあるように、本文の後にスペースを開けて [[ハイライト]] を配置する形式を厳守してください。

User: ${userInput}
AI:
`;

			const result = await model.generateContent(prompt);
			aiReply = result.response.text().trim();
		}

		// DB保存
		const { data: dbData, error: dbError } = await supabase
			.from("menhera_chats")
			.insert({
				user_input: userInput,
				ai_reply: aiReply,
				image_url: randomImage,
			})
			.select()
			.single();

		if (dbError) throw dbError;

		return NextResponse.json({
			id: dbData.id,
			user_input: userInput,
			ai_reply: aiReply,
			image_url: randomImage,
		});
	} catch (error) {
		console.error("Fatal Error:", error);
		const array = new Uint32Array(1);
		crypto.getRandomValues(array);
		const fallbackIndex = array[0] % IMAGE_CANDIDATES.length;

		return NextResponse.json(
			{
				error: "エラーが発生しました",
				ai_reply:
					"ごめんね、私の頭の中があなたのことで一杯で...もう一度言って？ [[頭の中があなたのことで一杯なの♡]]",
				image_url: IMAGE_CANDIDATES[fallbackIndex],
			},
			{ status: 500 },
		);
	}
}
