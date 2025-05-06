import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { videoId: string } }) {
  // videoId ile backend'den gerçek analiz sonucunu al
  const backendRes = await fetch(`http://localhost:8000/analyze-with-context?id=${params.videoId}`);

  if (!backendRes.ok) {
    return NextResponse.json({ error: 'Backend error' }, { status: 500 });
  }

  const result = await backendRes.json();
  return NextResponse.json(result);
} 