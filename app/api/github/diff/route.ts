import { NextRequest, NextResponse } from 'next/server';
import { fetchPRDiff, fetchDiffFromUrl } from '@/lib/github';

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-github-token');
  if (!token) {
    return NextResponse.json({ error: 'GitHub token required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const prParam = searchParams.get('pr');
  const url = searchParams.get('url');

  try {
    if (url) {
      const result = await fetchDiffFromUrl(token, url);
      return NextResponse.json(result);
    }

    if (!owner || !repo || !prParam) {
      return NextResponse.json({ error: 'owner, repo, and pr are required' }, { status: 400 });
    }

    const diff = await fetchPRDiff(token, owner, repo, parseInt(prParam, 10));
    return NextResponse.json({ diff });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch diff';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
