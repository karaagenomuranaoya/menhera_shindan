import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 短縮パラメータの取得
    // g: grade, s: score, n: rankName, a: answer, c: comment
    const grade = searchParams.get('g') || 'E';
    const score = searchParams.get('s') || '0';
    const rankName = searchParams.get('n') || '判定不能';
    const answer = searchParams.get('a') || '';
    const comment = searchParams.get('c') || '';

    const baseUrl = new URL(req.url).origin;

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
            {/* 左側：ランク画像と名前 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40%', justifyContent: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#d8b4fe', marginBottom: '10px', letterSpacing: '0.2em' }}>RESULT</div>
              <img
                src={`${baseUrl}/${grade}.png`}
                alt={grade}
                style={{
                  width: '240px',
                  height: '240px',
                  borderRadius: '30px',
                  border: '4px solid white',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  objectFit: 'cover',
                }}
              />
              <div style={{ marginTop: '20px', fontSize: '28px', fontWeight: '900', color: '#6b21a8', textAlign: 'center' }}>
                {rankName}
              </div>
              <div style={{ fontSize: '50px', fontWeight: '900', color: '#f472b6', fontStyle: 'italic' }}>
                {`Score: ${score}`}
                </div>
            </div>

            {/* 右側：回答とコメント */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '60%', paddingLeft: '40px', justifyContent: 'center' }}>
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
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#f472b6' }}>AI メンヘラ診断</div>
                <div style={{ marginLeft: '10px', fontSize: '12px', color: '#a78bfa' }}>menhera-check.vercel.app</div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}