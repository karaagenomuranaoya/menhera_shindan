import { Metadata } from "next";
import DiagnosisClient from "./DiagnosisClient";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const grade = params.g as string;
  const score = params.s as string;
  const rankName = params.n as string;
  const answer = params.a as string;
  const comment = params.c as string;

  const title = "AI メンヘラ診断";
  const description = "あなたの愛の重さをメンヘラのお友達AIが診断します。";

  if (grade) {
    const ogUrl = new URL("/api/og", "https://menhera-check.vercel.app"); // 自身のドメインに書き換えてください
    ogUrl.searchParams.set("g", grade);
    ogUrl.searchParams.set("s", score);
    ogUrl.searchParams.set("n", rankName);
    ogUrl.searchParams.set("a", answer);
    ogUrl.searchParams.set("c", comment);

    return {
      title: `${rankName}ランクでした！ | ${title}`,
      description,
      openGraph: {
        title: `${rankName}ランクでした！ | ${title}`,
        description,
        images: [ogUrl.toString()],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${rankName}ランクでした！ | ${title}`,
        description,
        images: [ogUrl.toString()],
      },
    };
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ["/ogp-main.png"],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/ogp-main.png"],
    },
  };
}

export default function Page() {
  return <DiagnosisClient />;
}