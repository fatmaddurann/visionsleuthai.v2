import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();

  // Videoyu gerçek backend'e gönder
const backendUrl = process.env.NEXT_PUBLIC_API_URL;
const backendRes = await fetch(`${backendUrl}/analyze-with-context`, {

  if (!backendRes.ok) {
    return NextResponse.json({ error: 'Backend error' }, { status: 500 });
  }

  // Backend'den dönen analiz sonucunu aynen ilet
  const result = await backendRes.json();
  return NextResponse.json(result);
} 
