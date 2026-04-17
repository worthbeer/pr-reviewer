import { NextRequest, NextResponse } from 'next/server';
import { listRepos } from '@/lib/github';

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-github-token');
  if (!token) {
    return NextResponse.json({ error: 'GitHub token required' }, { status: 401 });
  }

  try {
    const repos = await listRepos(token);
    return NextResponse.json(repos);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch repos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
