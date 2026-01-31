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

    const fontData = await fetch(
      new URL('https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansCJKjp-Bold.otf', import.meta.url)
    ).then((res) => res.arrayBuffer());

    if (!id) return new Response('Missing id', { status: 400 });

    const { data, error } = await supabase
        .from('menhera_chats')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return new Response('Result not found', { status: 404 });

    const { user_input, ai_reply, image_url } = data;

    // --- 変更点ここから ---
    // AIの返答が120文字を超えていたら切り取って "..." をつける
    const displayAiReply = ai_reply.length > 118 
      ? ai_reply.substring(0, 118) + '...' 
      : ai_reply;
    // --- 変更点ここまで ---

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f5ff',
            padding: '40px',
            fontFamily: '"NotoSansJP", sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 背景装飾 */}
          <div style={{ position: 'absolute', top: -100, right: -100, width: 600, height: 600, borderRadius: '50%', background: 'rgba(236, 72, 153, 0.1)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -100, width: 600, height: 600, borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', filter: 'blur(80px)' }} />

          {/* メインカード */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '40px',
              border: '4px solid #fff',
              boxShadow: '0 30px 80px rgba(0,0,0,0.08)',
              padding: '40px',
              alignItems: 'center',
              gap: '30px',
            }}
          >
            {/* 左側：キャラ画像 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', justifyContent: 'center' }}>
              <img
                src={image_url}
                alt="Menhera Girl"
                style={{
                  width: '280px',
                  height: '280px',
                  borderRadius: '30px',
                  objectFit: 'cover',
                  border: '6px solid white',
                  boxShadow: '0 15px 40px rgba(236, 72, 153, 0.2)',
                }}
              />
              <div style={{ marginTop: '15px', fontSize: '20px', color: '#d8b4fe', fontWeight: '900', letterSpacing: '0.1em' }}>
                AI MENHERA
              </div>
            </div>

            {/* 右側：チャットエリア */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              width: '70%', 
              height: '100%',
              gap: '15px',
              alignItems: 'center',
            }}>
              
              {/* ユーザーの言葉 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                 <div style={{ fontSize: '14px', color: '#a855f7', fontWeight: 'bold', marginBottom: '5px', opacity: 0.6 }}>YOU</div>
                 <div style={{ 
                   backgroundColor: '#f3e8ff', 
                   color: '#6b21a8', 
                   padding: '12px 25px', 
                   borderRadius: '20px', 
                   fontSize: '25px', 
                   fontWeight: '600',
                   textAlign: 'center',
                   maxWidth: '90%',
                   boxShadow: 'none',
                   border: '1px solid #e9d5ff'
                 }}>
                   {user_input.length > 40 ? user_input.substring(0, 40) + '...' : user_input}
                 </div>
              </div>

              {/* 矢印 */}
              <div style={{ display: 'flex', opacity: 0.2 }}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="3">
                   <path d="M12 5v14M5 12l7 7 7-7" />
                 </svg>
              </div>

              {/* AIの返信 */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                width: '100%', 
                flex: 1,
                justifyContent: 'center' 
              }}>
                 <div style={{ fontSize: '16px', color: '#ec4899', fontWeight: 'bold', marginBottom: '8px', opacity: 0.8 }}>INTERPRETATION</div>
                 <div style={{ 
                   backgroundColor: 'white', 
                   color: '#be185d', 
                   padding: '30px', 
                   borderRadius: '30px', 
                   border: '3px solid #fce7f3',
                   fontSize: '32px',
                   fontWeight: '900',
                   lineHeight: '1.5',
                   textAlign: 'center',
                   width: '100%',
                   height: '100%',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   boxShadow: '0 10px 40px rgba(236, 72, 153, 0.15)'
                 }}>
                   {/* ここを変数 displayAiReply に変更しました */}
                   {displayAiReply}
                 </div>
              </div>

            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
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