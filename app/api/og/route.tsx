import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // ★追加: Google FontsからNoto Sans JPを読み込む
    const fontData = await fetch(
      new URL('https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansCJKjp-Bold.otf', import.meta.url)
    ).then((res) => res.arrayBuffer());

    if (!id) return new Response('Missing id', { status: 400 });

    const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return new Response('Result not found', { status: 404 });

    const { grade, score, rank_name, answer, comment, question, image_url } = data;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f5ff',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* 背景の装飾 */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(244, 114, 182, 0.15)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', filter: 'blur(60px)' }} />

          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '40px',
              border: '2px solid #f3e8ff',
              padding: '40px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              flexDirection: 'row',
            }}
          >
            {/* 左側：ランク・画像・スコア */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40%', justifyContent: 'center' }}>
              
              {/* RESULTラベル */}
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#d8b4fe', marginBottom: '0px', letterSpacing: '0.2em' }}>RESULT</div>

              {/* Grade（派手に追加） */}
              <div style={{ 
                fontSize: '70px', 
                fontWeight: '900', 
                color: '#f472b6', // ピンク色
                fontStyle: 'italic', 
                marginBottom: '10px',
                textShadow: '0 4px 10px rgba(244, 114, 182, 0.4)', // 光るような影
                lineHeight: 1,
                display: 'flex'
              }}>
                Rank : {grade}
              </div>

              {/* 画像 */}
              <img
                src={image_url}
                alt={grade}
                style={{
                  width: '280px',
                  height: '280px',
                  borderRadius: '30px',
                  border: '4px solid white',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  objectFit: 'cover',
                  marginBottom: '15px',
                }}
              />

              {/* ランク名 */}
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#6b21a8', textAlign: 'center', marginBottom: '5px' }}>
                {rank_name}
              </div>

              {/* Score（派手に変更） */}
              <div style={{ 
                fontSize: '40px', 
                fontWeight: '900', 
                color: '#ec4899', // 濃いピンク
                fontStyle: 'italic',
                textShadow: '0 2px 5px rgba(236, 72, 153, 0.3)',
                display: 'flex'
              }}>
                Score : {score}
              </div>
            </div>

            {/* 右側：質問・回答・コメント */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '60%', paddingLeft: '40px', justifyContent: 'center' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                <div style={{ fontSize: '10px', fontWeight: '900', color: '#d8b4fe', marginBottom: '3px' }}>QUESTION</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b21a8' }}>{question}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#f472b6', marginBottom: '5px' }}>YOUR ANSWER</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e1b4b', backgroundColor: 'white', padding: '15px', borderRadius: '20px', border: '1px solid #fae8ff' }}>
                  {answer}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#d8b4fe', marginBottom: '5px' }}>AI REVIEW</div>
                <div style={{ fontSize: '16px', color: '#581c87', lineHeight: '1.6', fontWeight: '500' }}>
                  {comment}
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#f472b6' }}>AI 闇恋診断</div>
                <div style={{ marginLeft: '10px', fontSize: '12px', color: '#a78bfa' }}>yamikoi-shindan.vercel.app</div>
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200,
        height: 630, 
        // ★追加: フォント設定
        fonts: [
          {
            name: 'NotoSansJP',
            data: fontData,
            style: 'normal',
          },
        ],
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}