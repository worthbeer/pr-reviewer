import { NextRequest, NextResponse } from 'next/server';
import { listOpenPRs } from '@/lib/github';

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-github-token');
  if (!token) {
    return NextResponse.json({ error: 'GitHub token required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 });
  }

  try {
    const prs = await listOpenPRs(token, owner, repo);
    return NextResponse.json(prs);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch PRs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
