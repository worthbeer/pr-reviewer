'use client';

import { useState, useCallback } from 'react';
import type { GitHubRepo, GitHubPR } from '@/types';

interface Props {
  token: string;
  onDiffReady: (diff: string) => void;
}

export default function GitHubBrowser({ token, onDiffReady }: Props) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [prs, setPrs] = useState<GitHubPR[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingPRs, setLoadingPRs] = useState(false);
  const [loadingDiff, setLoadingDiff] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadRepos = useCallback(async () => {
    setLoadingRepos(true);
    setError('');
    try {
      const res = await fetch('/api/github/repos', {
        headers: { 'x-github-token': token },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to load repos');
      }
      setRepos(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load repos');
    } finally {
      setLoadingRepos(false);
    }
  }, [token]);

  const selectRepo = useCallback(async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setPrs([]);
    setLoadingPRs(true);
    setError('');
    try {
      const res = await fetch(
        `/api/github/prs?owner=${repo.owner}&repo=${repo.name}`,
        { headers: { 'x-github-token': token } }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to load PRs');
      }
      setPrs(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load PRs');
    } finally {
      setLoadingPRs(false);
    }
  }, [token]);

  const fetchDiff = useCallback(async (pr: GitHubPR) => {
    if (!selectedRepo) return;
    setLoadingDiff(pr.number);
    setError('');
    try {
      const res = await fetch(
        `/api/github/diff?owner=${selectedRepo.owner}&repo=${selectedRepo.name}&pr=${pr.number}`,
        { headers: { 'x-github-token': token } }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to fetch diff');
      }
      const data = await res.json();
      onDiffReady(data.diff);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch diff');
    } finally {
      setLoadingDiff(null);
    }
  }, [token, selectedRepo, onDiffReady]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {repos.length === 0 ? (
        <button
          onClick={loadRepos}
          disabled={loadingRepos}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-md text-sm text-gray-200 transition-colors"
        >
          {loadingRepos ? 'Loading repos…' : 'Load my repositories'}
        </button>
      ) : (
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Repository</label>
          <div className="max-h-48 overflow-y-auto rounded-md border border-gray-700 divide-y divide-gray-700">
            {repos.map((repo) => (
              <button
                key={repo.full_name}
                onClick={() => selectRepo(repo)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  selectedRepo?.full_name === repo.full_name
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <span className="font-medium">{repo.full_name}</span>
                {repo.private && (
                  <span className="ml-2 text-xs text-gray-500">private</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedRepo && (
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Open PRs — {selectedRepo.full_name}
          </label>
          {loadingPRs ? (
            <div className="text-sm text-gray-400 text-center py-4">Loading PRs…</div>
          ) : prs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">No open PRs</div>
          ) : (
            <div className="max-h-56 overflow-y-auto rounded-md border border-gray-700 divide-y divide-gray-700">
              {prs.map((pr) => (
                <button
                  key={pr.number}
                  onClick={() => fetchDiff(pr)}
                  disabled={loadingDiff === pr.number}
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs text-gray-500 mr-1.5">#{pr.number}</span>
                      <span className="text-sm text-gray-200">{pr.title}</span>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {loadingDiff === pr.number ? 'Fetching…' : `+${pr.additions} -${pr.deletions}`}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">by {pr.user}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
