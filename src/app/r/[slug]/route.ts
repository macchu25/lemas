import { NextRequest, NextResponse } from 'next/server';
import { API_BASE } from '@/lib/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  if (!slug) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const res = await fetch(`${API_BASE}/api/r/resolve?slug=${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.target_url && (data.target_url.startsWith('http://') || data.target_url.startsWith('https://'))) {
        return NextResponse.redirect(data.target_url, 302);
      }
    }
  } catch (err) {
    console.error('Redirect resolve error:', err);
  }

  // Fallback to backend redirect handler
  return NextResponse.redirect(`${API_BASE}/r/${slug}`, 302);
}
