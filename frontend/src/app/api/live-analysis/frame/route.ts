import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('API route hit!');
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    const backendRes = await fetch(`${backendUrl}/live-analysis/frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Proxy error' }, { status: 500 });
  }
} 
