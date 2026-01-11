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

    // Noto Sans JP Boldを読み込む
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
            backgroundColor: '#050000', // 黒背景
            padding: '40px',
            fontFamily: 'NotoSansJP',
            backgroundImage: 'radial-gradient(circle at 50% 50%, #1a0000 0%, #000000 100%)',
          }}
        >
          {/* 背景の装飾 */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '10px', background: '#8b0000' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '10px', background: '#8b0000' }} />

          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(20, 0, 0, 0.9)',
              borderRadius: '10px',
              border: '4px solid #3f0000',
              padding: '40px',
              boxShadow: '0 0 60px rgba(255,0,0,0.1)',
              overflow: 'hidden',
              flexDirection: 'row',
            }}
          >
            {/* 左側：ランク・画像・スコア */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40%', justifyContent: 'center' }}>
              
              {/* JUDGMENTラベル */}
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#ff0000', marginBottom: '0px', letterSpacing: '0.2em' }}>JUDGMENT</div>

              {/* Grade（元のコードのサイズ感に戻し、色は赤へ） */}
              <div style={{ 
                fontSize: '70px', 
                fontWeight: '900', 
                color: '#ff0000', 
                fontStyle: 'italic', 
                marginBottom: '10px',
                textShadow: '4px 4px 0px #3f0000',
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
                  width: '250px',
                  height: '250px',
                  borderRadius: '4px',
                  border: '4px solid #500000',
                  objectFit: 'cover',
                  marginBottom: '15px',
                  filter: 'grayscale(80%) contrast(1.2)',
                }}
              />

              {/* ランク名 */}
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', textAlign: 'center', marginBottom: '5px' }}>
                {rank_name}
              </div>

              {/* Score */}
              <div style={{ 
                fontSize: '40px', 
                fontWeight: '900', 
                color: '#8b0000', 
                fontStyle: 'italic',
                display: 'flex',
                textShadow: '0 2px 5px rgba(0,0,0,0.5)',
              }}>
                Score : {score}
              </div>
            </div>

            {/* 右側：質問・回答・コメント */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '60%', paddingLeft: '40px', justifyContent: 'center' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                <div style={{ fontSize: '10px', fontWeight: '900', color: '#ff0000', marginBottom: '3px', letterSpacing: '0.1em' }}>TRIAL (お題)</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#cccccc' }}>{question}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#ff0000', marginBottom: '5px', letterSpacing: '0.1em' }}>CONFESSION (回答)</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', backgroundColor: '#200000', padding: '15px', borderRadius: '4px', borderLeft: '6px solid #ff0000' }}>
                  {answer}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#ff0000', marginBottom: '5px', letterSpacing: '0.1em' }}>VERDICT (審判)</div>
                <div style={{ fontSize: '16px', color: '#aaaaaa', lineHeight: '1.6', fontWeight: '500' }}>
                  {comment.length > 85 ? comment.substring(0, 85) + '...' : comment}
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', borderTop: '1px solid #330000', paddingTop: '15px' }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>AI 狂愛コロシアム</div>
                <div style={{ marginLeft: '10px', fontSize: '12px', color: '#666666' }}>yamikoi-shindan.vercel.app</div>
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200,
        height: 630, 
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