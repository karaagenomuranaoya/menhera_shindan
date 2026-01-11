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

    // フォント読み込み（安定版）
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

    // DB構造変更に対応: rank_name -> title
    // 古いデータとの互換性のため data.title がなければ data.rank_name を使う（データ移行したならtitleだけでOK）
    const title = data.title || data.rank_name;
    const { grade, score, answer, image_url, pick_up_phrase } = data;
    
    const displayText = pick_up_phrase || (answer.length > 20 ? answer.substring(0, 19) + "..." : answer);
    const formattedScore = new Intl.NumberFormat('en-US').format(score);

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
            backgroundColor: '#050000',
            padding: '40px',
            fontFamily: 'NotoSansJP',
            backgroundImage: 'radial-gradient(circle at 50% 50%, #1a0000 0%, #000000 100%)',
          }}
        >
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
            {/* 左側：Gradeと画像と称号 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%', justifyContent: 'center', borderRight: '2px solid #500000', paddingRight: '20px' }}>
              
              <div style={{ fontSize: '70px', fontWeight: '900', color: '#ff0000', fontStyle: 'italic', marginBottom: '15px', textShadow: '4px 4px 0px #3f0000', lineHeight: 1 }}>
                {grade}
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image_url}
                alt={grade}
                style={{
                  width: '240px',
                  height: '240px',
                  borderRadius: '10px',
                  border: '4px solid #500000',
                  objectFit: 'cover',
                  marginBottom: '20px',
                  filter: 'grayscale(50%) contrast(1.2)',
                }}
              />

              <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', textAlign: 'center' }}>
                {title}
              </div>
            </div>

            {/* 右側：キラーフレーズとスコア */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '65%', paddingLeft: '40px', justifyContent: 'space-between' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #500000', paddingBottom: '10px' }}>
                <div style={{ fontSize: '24px', color: '#8b0000', fontWeight: '900', letterSpacing: '0.1em' }}>AI 狂愛コロシアム</div>
                <div style={{ fontSize: '16px', color: '#666' }}>madlove-coliseum.vercel.app</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <div style={{ fontSize: '14px', color: '#ff0000', marginBottom: '15px', fontWeight: '900', letterSpacing: '0.2em' }}>PICK UP MADNESS</div>
                <div style={{ 
                  fontSize: '42px', 
                  fontWeight: '900', 
                  color: '#ffffff', 
                  textAlign: 'center', 
                  lineHeight: '1.4',
                  textShadow: '0 0 20px rgba(255,255,255,0.2)',
                  wordBreak: 'break-all',
                  display: 'flex',
                }}>
                  {displayText}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '16px', color: '#8b0000', marginBottom: '0px', letterSpacing: '0.2em', fontWeight: '900' }}>TOTAL SCORE</div>
                <div style={{ 
                  fontSize: '90px', 
                  fontWeight: '900', 
                  color: '#ff0000', 
                  lineHeight: 1,
                  fontStyle: 'italic',
                  textShadow: '5px 5px 0px #300000',
                  letterSpacing: '-3px'
                }}>
                  {formattedScore}
                </div>
              </div>

            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts: [{ name: 'NotoSansJP', data: fontData, style: 'normal' }] }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}