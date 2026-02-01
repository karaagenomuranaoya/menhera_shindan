"use client";
import { motion } from "framer-motion";
import {
	Check,
	ChevronLeft,
	Link as LinkIcon,
	RefreshCw,
	Send,
	Shuffle,
	Sparkles,
	Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import OgImagePreview from "./components/OgImagePreview";
import TermsModal from "./components/TermsModal";

type ChatResult = {
	id: string;
	user_input: string;
	ai_reply: string;
	image_url: string;
};

const STORAGE_KEY = "menhera_chat_draft";

// 修正用のヘルパー関数を作成（コンポーネント内でも外でもOK）
const formatReply = (text: string) => {
	// [[...]] の部分を削除して返す
	return text.replace(/\[\[.*?\]\]/g, "").trim();
};

// ▼▼▼ 100個以上の厳選ワードリスト ▼▼▼
const ALL_SUGGESTIONS = [
	// --- 基本・日常 ---
	"おはよう",
	"おやすみ",
	"仕事終わった！疲れた〜",
	"今からお風呂入るね",
	"今日は雨だね",
	"お腹すいた...何食べよう？",
	"美容院行ってくる",
	"コンビニ行ってくる",
	"ただいま！",
	"パソコンが壊れちゃった",

	// --- 疑惑・地雷（軽） ---
	"ごめん、昨日は寝落ちしてた",
	"スマホの通知オフにするね",
	"バッテリー切れそう",
	"今、運転中だからまた後で",
	"週末は友達と旅行行ってくる",
	"会社の飲み会行ってくる！",
	"今日は帰り遅くなるかも",
	"久しぶりに同窓会があるんだ",
	"その日は予定があるから無理",
	"知らない番号から着信があった",

	// --- 疑惑・地雷（重） ---
	"スマホのパスワード変えたよ",
	"会社の女の子にチョコもらった",
	"元カノから連絡きたんだけど",
	"最近、視線を感じる気がする...",
	"GPSアプリ、バッテリー食うから消したよ",
	"誰かと間違えてない？",
	"え、その話したっけ？",
	"ちょっと一人になりたい",
	"携帯、家に忘れてた",
	"なんでそんなに疑うの？",

	// --- 愛情・激重 ---
	"愛してる。死ぬまで一緒だよ",
	"世界で一番好きだよ",
	"ずっと一緒にいようね",
	"GPSつけていいよ♡",
	"僕のすべては君のものだよ",
	"結婚しよう",
	"合鍵、作っておいたよ",
	"大好きだよ",
	"来世でも一緒にいようね",
	"君の好きなところ、100個言えるよ",
	"僕の心臓、君にあげる",
	"かわいいね",
	"君の匂いがすると安心する",
	"もう君しか見えない",

	// --- 拒絶・冷淡（危険） ---
	"ちょっと距離を置きたい",
	"重い。疲れた",
	"連絡してこないで",
	"別れよう",
	"僕のこと嫌いになった？",
	"もう限界かもしれない",
	"友達に戻ろう",
	"そういうところ、直してほしい",
	"鍵、ポストに入れておいて",
	"話がある",
	"他に好きな人ができた",
	"もう信じられない",
	"放っておいてくれ",
	"依存するのは良くないよ",

	// --- 意味不明・その他 ---
	"あ",
	"ぬるぽ",
	"たんぽぽ食べてる",
	"宇宙人と交信中",
	"壁の中から物音がする",
	"冷蔵庫のプリン食べた？",
	"ベランダに誰かいる...",
	"遺書書いた",
	"髪の毛、一本ちょうだい",
	"君の部屋の盗聴器、電池切れそうだよ",
	"来ちゃった♡",
	"見てるよ",
];

// フィッシャー–イェーツのシャッフル（偏りなく混ぜる関数）
function shuffleArray<T>(array: T[]): T[] {
	const newArray = [...array];
	for (let i = newArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
	}
	return newArray;
}

export default function DiagnosisClient() {
	const [step, setStep] = useState(0);
	const [userInput, setUserInput] = useState("");
	const [result, setResult] = useState<ChatResult | null>(null);
	const [copied, setCopied] = useState(false);
	const [showTerms, setShowTerms] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	// ランダムなサジェストを保持するState
	const [suggestions, setSuggestions] = useState<string[]>([]);

	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const savedInput = localStorage.getItem(STORAGE_KEY);
			if (savedInput) setUserInput(savedInput);
			setIsLoaded(true);

			// ★★★ 初回ロード時にランダムに10個選出 ★★★
			setSuggestions(shuffleArray(ALL_SUGGESTIONS).slice(0, 10));
		}
	}, []);

	// シャッフルボタン用
	const refreshSuggestions = () => {
		setSuggestions(shuffleArray(ALL_SUGGESTIONS).slice(0, 10));
	};

	useEffect(() => {
		if (isLoaded) localStorage.setItem(STORAGE_KEY, userInput);
	}, [userInput, isLoaded]);

	const clearInput = () => {
		if (userInput && confirm("メッセージを消去しますか？")) {
			setUserInput("");
			localStorage.removeItem(STORAGE_KEY);
		}
	};

	const sendMessage = async () => {
		if (!userInput.trim()) return;
		setStep(2);
		try {
			const res = await fetch("/api/diagnose", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user_input: userInput }),
			});

			const data = await res.json();
			if (data.error) throw new Error(data.error);
			if (!data.id) throw new Error("API Error");

			setResult(data);
			setStep(3);
		} catch (e) {
			console.error(e);
			alert(
				"通信エラー、またはAIが感情を処理しきれませんでした。もう一度試してね。",
			);
			setStep(1);
		}
	};

	const handleSuggestion = (text: string) => {
		setUserInput(text);
		if (textareaRef.current) {
			textareaRef.current.focus();
		}
	};

	const shareOnX = () => {
		if (!result) return;
		const text = `AIメンヘラ彼女が怖すぎた...\n#AIメンヘラ彼女\n`;
		const shareUrl = `${window.location.origin}/result/${result.id}`;
		const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
		window.open(xUrl, "_blank");
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
		setUserInput("");
		// 再開時にもサジェストを新しくする
		setSuggestions(shuffleArray(ALL_SUGGESTIONS).slice(0, 10));
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<main className="min-h-screen bg-[#f8f5ff] text-purple-900 flex flex-col items-center justify-center p-4 font-sans selection:bg-purple-200">
			<div className="w-full max-w-md bg-white/70 p-6 rounded-[2.5rem] border border-purple-100 shadow-2xl shadow-purple-200/50 backdrop-blur-xl relative min-h-[500px] flex flex-col transition-all">
				{/* ヘッダー */}
				<div className="relative mb-6 text-center shrink-0">
					{step > 0 && step < 3 && (
						// biome-ignore lint/a11y/useButtonType: <explanation>
						<button
							onClick={() => setStep(step === 1 ? 0 : 1)}
							className="absolute left-0 top-1/2 -translate-y-1/2 text-purple-300 p-2 hover:bg-purple-50 rounded-full transition-colors"
						>
							<ChevronLeft size={24} />
						</button>
					)}

					{/** biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
					<h1
						onClick={() => setStep(0)}
						className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-pink-400 inline-block cursor-pointer"
					>
						AIメンヘラ彼女
						<br />
						<span className="text-[10px] font-bold text-purple-300 tracking-normal">
							AI Menhera GirlFriend
						</span>
					</h1>
				</div>

				{/* コンテンツエリア */}
				<div className="flex-1 flex flex-col justify-center">
					{/* STEP 0: LP */}
					{step === 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-center space-y-6"
						>
							<div className="w-full overflow-hidden rounded-2xl shadow-md border-2 border-white/50 group">
								{/** biome-ignore lint/performance/noImgElement: <explanation> */}
								<img
									src="/banner.png"
									alt="Main Banner"
									className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
								/>
							</div>

							<div className="space-y-2">
								<p className="text-xs text-purple-400/80 leading-relaxed max-w-[260px] mx-auto">
									<span className="block py-2">
										<span className="inline-block animate-bounce-subtle text-base font-black tracking-tighter bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(255,182,193,0.5)]">
											AIがあなたのメッセージに
										</span>
									</span>
									<span className="block py-2">
										<span className="inline-block animate-bounce-subtle text-base font-black tracking-tighter bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(255,182,193,0.5)]">
											♡かわいく猟奇的に♡
										</span>
									</span>
									<span className="block py-2">
										<span className="inline-block animate-bounce-subtle text-base font-black tracking-tighter bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(255,182,193,0.5)]">
											返信します。
										</span>
									</span>
								</p>
							</div>

							{/** biome-ignore lint/a11y/useButtonType: <explanation> */}
							<button
								onClick={() => setStep(1)}
								className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2 group"
							>
								AIにメッセージを送ってみる
								<Send
									size={18}
									className="group-hover:translate-x-1 transition-transform"
								/>
							</button>
						</motion.div>
					)}

					{/* STEP 1: 入力 */}
					{step === 1 && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="space-y-4"
						>
							<div className="text-center mb-2">
								<p className="text-sm font-bold text-purple-600">
									彼女にメッセージを送る
								</p>
								<p className="text-[10px] text-purple-400">
									タップして入力、または自由に書いてね
								</p>
							</div>
							<div className="w-full space-y-3 mb-6">
								<div className="flex items-center justify-between px-2">
									<div className="flex items-center gap-2">
										<p className="text-xs text-purple-400 font-bold">
											何を話しかける？
										</p>
									</div>
									{/** biome-ignore lint/a11y/useButtonType: <explanation> */}
									<button
										onClick={refreshSuggestions}
										className="flex items-center gap-1 text-[10px] text-pink-500 font-bold hover:bg-pink-50 px-2 py-1 rounded-full transition-colors"
									>
										<Shuffle size={12} />
										シャッフル
									</button>
								</div>

								{/* グリッドレイアウトに変更 */}
								<div className="grid grid-cols-2 gap-3">
									{suggestions.slice(0, 6).map(
										(
											text,
											i, // 6個に絞って大きく表示
										) => (
											<motion.button
												key={`${text}-${
													// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
													i
												}`} // キーをユニークに
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												transition={{ delay: i * 0.05 }}
												onClick={() => handleSuggestion(text)}
												className="
          relative group
          flex items-center justify-start text-left
          p-3 min-h-[60px]
          bg-white border-2 border-purple-100 
          rounded-2xl rounded-tl-none 
          shadow-sm hover:shadow-md hover:border-pink-300 hover:-translate-y-0.5
          transition-all duration-200
        "
											>
												<span className="text-xs font-bold text-purple-800 leading-tight group-hover:text-pink-600 transition-colors">
													{text}
												</span>
											</motion.button>
										),
									)}
								</div>
							</div>
							<div className="relative group">
								<textarea
									ref={textareaRef}
									className="w-full bg-white border-2 border-purple-100 rounded-2xl p-4 text-purple-900 focus:outline-none focus:border-pink-300 min-h-[140px] transition-colors placeholder-purple-200 text-base shadow-sm pr-10 resize-none"
									placeholder="例：今から飲み会行ってくるね！"
									value={userInput}
									onChange={(e) => setUserInput(e.target.value)}
									maxLength={100}
								/>

								{userInput && (
									// biome-ignore lint/a11y/useButtonType: <explanation>
									<button
										onClick={clearInput}
										className="absolute top-3 right-3 text-purple-200 hover:text-pink-400 transition-colors p-1"
									>
										<Trash2 size={18} />
									</button>
								)}
							</div>
							<div className="flex justify-between items-center px-1">
								<span></span>
								<span
									className={`text-[10px] font-bold ${userInput.length >= 100 ? "text-pink-500" : "text-purple-300"}`}
								>
									{userInput.length} / 100 文字
								</span>
							</div>
							{/** biome-ignore lint/a11y/useButtonType: <explanation> */}
							<button
								onClick={sendMessage}
								className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black disabled:opacity-30 disabled:grayscale transition-all shadow-md shadow-purple-100 flex items-center justify-center gap-2 hover:bg-purple-700 active:scale-[0.98]"
								disabled={!userInput}
							>
								<Sparkles
									size={18}
									className={userInput ? "animate-pulse" : ""}
								/>
								送信する
							</button>
						</motion.div>
					)}

					{/* STEP 2: ローディング */}
					{step === 2 && (
						<div className="text-center py-20 space-y-4">
							<div className="relative inline-block">
								<div className="animate-spin w-12 h-12 border-[4px] border-purple-100 border-t-pink-500 rounded-full"></div>
								<div className="absolute inset-0 flex items-center justify-center text-xs">
									♡
								</div>
							</div>
							<div>
								<p className="text-sm text-purple-500 font-bold animate-pulse">
									既読がつきました...
								</p>
								<p className="text-[10px] text-purple-300 mt-1">
									もうちょっと待っててね
									<span className="animate-pulse">...</span>
								</p>
							</div>
						</div>
					)}

					{/* STEP 3: 結果 */}
					{step === 3 && result && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="space-y-6"
						>
							{/* チャット風表示 */}
							<div className="space-y-4 bg-purple-50/50 p-4 rounded-[2rem] border border-purple-100">
								{/* ユーザー */}
								<div className="flex justify-end items-end gap-2">
									<div className="bg-purple-200 text-purple-900 text-xs py-2 px-4 rounded-2xl rounded-br-none max-w-[80%] shadow-sm">
										{result.user_input}
									</div>
									<div className="w-6 h-6 rounded-full bg-purple-300 flex items-center justify-center text-[10px] text-white shrink-0 font-bold">
										Me
									</div>
								</div>

								{/* AI */}
								<div className="flex justify-start items-end gap-2">
									<img
										src={result.image_url}
										alt="AI"
										className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
									/>
									<div className="bg-white text-purple-900 text-sm font-bold py-3 px-4 rounded-2xl rounded-bl-none max-w-[85%] shadow-md border border-pink-100 leading-relaxed text-left">
										{/* ▼ ここで関数を使う ▼ */}
										{formatReply(result.ai_reply)}
									</div>
								</div>
							</div>

							{/* シェア・保存エリア */}
							<div className="space-y-4 pt-4 border-t border-purple-100">
								<OgImagePreview id={result.id} />

								<p className="text-[10px] text-center text-purple-400 font-medium">
									かわいい彼女の返信をシェアしよう
								</p>

								<div className="flex gap-2">
									{/** biome-ignore lint/a11y/useButtonType: <explanation> */}
									<button
										onClick={shareOnX}
										className="flex-[2] py-3 bg-black text-white rounded-xl font-bold text-xs hover:opacity-80 transition-all flex items-center justify-center gap-2 shadow-lg"
									>
										{/** biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
										<svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
											<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
										</svg>
										Xで共有
									</button>
									{/** biome-ignore lint/a11y/useButtonType: <explanation> */}
									<button
										onClick={copyLink}
										className="flex-1 py-3 bg-white border border-purple-200 text-purple-400 rounded-xl font-bold hover:bg-purple-50 transition-all flex items-center justify-center shadow-sm"
									>
										{copied ? <Check size={18} /> : <LinkIcon size={18} />}
									</button>
								</div>
							</div>

							{/** biome-ignore lint/a11y/useButtonType: <explanation> */}
							<button
								onClick={handleRestart}
								className="w-full group flex items-center justify-center gap-2 text-xs text-purple-400 font-bold py-3 hover:text-purple-600 transition-colors"
							>
								<RefreshCw
									size={14}
									className="group-hover:rotate-180 transition-transform duration-500"
								/>
								別のメッセージを送る
							</button>
						</motion.div>
					)}
				</div>

				{/* フッターリンク */}
				<div className="mt-4 pt-4 border-t border-purple-50 text-center shrink-0">
					{/** biome-ignore lint/a11y/useButtonType: <explanation> */}
					<button
						onClick={() => setShowTerms(true)}
						className="text-[10px] text-purple-300 hover:text-purple-500 transition-colors"
					>
						利用規約・データの扱い
					</button>
				</div>

				<TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
			</div>
		</main>
	);
}
