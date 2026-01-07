import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // 本番のURL（最後にスラッシュなし）
  const baseUrl = 'https://yamikoi-shindan.vercel.app' 

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