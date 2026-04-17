import type { GitHubRepo, GitHubPR } from '@/types';

const GITHUB_API = 'https://api.github.com';

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export async function listRepos(token: string): Promise<GitHubRepo[]> {
  const res = await fetch(
    `${GITHUB_API}/user/repos?sort=updated&per_page=50&type=all`,
    { headers: githubHeaders(token) }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  return data.map((r: { full_name: string; name: string; owner: { login: string }; private: boolean; updated_at: string }) => ({
    full_name: r.full_name,
    name: r.name,
    owner: r.owner.login,
    private: r.private,
    updated_at: r.updated_at,
  }));
}

export async function listOpenPRs(token: string, owner: string, repo: string): Promise<GitHubPR[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=open&per_page=30`,
    { headers: githubHeaders(token) }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  return data.map((pr: { number: number; title: string; html_url: string; user: { login: string }; created_at: string; changed_files?: number; additions?: number; deletions?: number }) => ({
    number: pr.number,
    title: pr.title,
    html_url: pr.html_url,
    user: pr.user.login,
    created_at: pr.created_at,
    changed_files: pr.changed_files ?? 0,
    additions: pr.additions ?? 0,
    deletions: pr.deletions ?? 0,
  }));
}

export async function fetchPRDiff(token: string, owner: string, repo: string, prNumber: number): Promise<string> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        ...githubHeaders(token),
        Accept: 'application/vnd.github.diff',
      },
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || `GitHub API error: ${res.status}`);
  }

  return res.text();
}

export async function fetchDiffFromUrl(token: string, prUrl: string): Promise<{ diff: string; owner: string; repo: string; prNumber: number }> {
  // Parse https://github.com/owner/repo/pull/123
  const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) {
    throw new Error('Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123');
  }

  const [, owner, repo, prStr] = match;
  const prNumber = parseInt(prStr, 10);
  const diff = await fetchPRDiff(token, owner, repo, prNumber);

  return { diff, owner, repo, prNumber };
}
