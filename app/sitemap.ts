import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // 本番のURL（最後にスラッシュなし）
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://madlove-coliseum.vercel.app'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // 結果ページは動的なので、とりあえずトップページだけでOK
  ]
}