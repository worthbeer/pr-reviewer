'use client';

import { useState, useRef } from 'react';
import ModelSwitcher from '@/components/ModelSwitcher';
import ScopeToggles from '@/components/ScopeToggles';
import ReviewPanel from '@/components/ReviewPanel';
import GitHubBrowser from '@/components/GitHubBrowser';
import type { ReviewModel, ReviewScope } from '@/types';

type InputMode = 'paste' | 'github';

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [model, setModel] = useState<ReviewModel>('claude-sonnet-4-6');
  const [scopes, setScopes] = useState<ReviewScope[]>(['quality', 'security', 'style']);

  // paste/URL mode
  const [diff, setDiff] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');

  // review state
  const [review, setReview] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  async function loadDiffFromUrl() {
    if (!prUrl.trim() || !githubToken.trim()) {
      setError('Both GitHub token and PR URL are required.');
      return;
    }
    setError('');
    try {
      const res = await fetch(`/api/github/diff?url=${encodeURIComponent(prUrl)}`, {
        headers: { 'x-github-token': githubToken },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to fetch diff');
      }
      const data = await res.json();
      setDiff(data.diff);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch diff');
    }
  }

  async function startReview(diffText: string) {
    if (!diffText.trim()) {
      setError('No diff to review.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setReview('');
    setError('');
    setIsStreaming(true);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff: diffText, model, scopes }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setReview(accumulated);
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Review failed');
    } finally {
      setIsStreaming(false);
    }
  }

  function handleReview() {
    startReview(diff);
  }

  const canReview = diff.trim().length > 0 && !isStreaming;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">PR Reviewer</h1>
          <p className="text-gray-400 text-sm mt-1">
            Token-efficient code review powered by Claude
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          {/* Left column — main input */}
          <div className="space-y-4">
            {/* Mode tabs */}
            <div className="flex border-b border-gray-800">
              {(['paste', 'github'] as InputMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    inputMode === mode
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {mode === 'paste' ? 'Paste Diff / URL' : 'GitHub Browser'}
                </button>
              ))}
            </div>

            {inputMode === 'paste' ? (
              <div className="space-y-3">
                {/* PR URL fetch */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    GitHub Token (required to fetch PR diff)
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_…"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://github.com/owner/repo/pull/123"
                    value={prUrl}
                    onChange={(e) => setPrUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={loadDiffFromUrl}
                    disabled={!prUrl.trim() || !githubToken.trim()}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-md text-sm text-gray-200 transition-colors whitespace-nowrap"
                  >
                    Fetch diff
                  </button>
                </div>

                <div className="relative">
                  <label className="block text-xs text-gray-400 mb-1">
                    Or paste a unified diff directly
                  </label>
                  <textarea
                    value={diff}
                    onChange={(e) => setDiff(e.target.value)}
                    placeholder={`diff --git a/src/index.ts b/src/index.ts\n--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,5 +1,6 @@\n+import something from 'somewhere'\n …`}
                    rows={12}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-md text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-y"
                  />
                  {diff && (
                    <button
                      onClick={() => setDiff('')}
                      className="absolute top-7 right-2 text-xs text-gray-500 hover:text-gray-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    GitHub Personal Access Token
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_…"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {githubToken.trim() ? (
                  <GitHubBrowser
                    token={githubToken}
                    onDiffReady={(d) => {
                      setDiff(d);
                      setInputMode('paste');
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-500">Enter a GitHub token above to browse your repositories.</p>
                )}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {/* Review button */}
            <button
              onClick={handleReview}
              disabled={!canReview}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-md text-sm font-semibold text-white transition-colors"
            >
              {isStreaming ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Reviewing…
                </span>
              ) : (
                'Review PR'
              )}
            </button>

            <ReviewPanel review={review} isStreaming={isStreaming} />
          </div>

          {/* Right column — settings */}
          <div className="space-y-5">
            <ModelSwitcher value={model} onChange={setModel} />
            <ScopeToggles value={scopes} onChange={setScopes} />

            <div className="rounded-md border border-gray-800 p-3 text-xs text-gray-500 space-y-1">
              <div className="text-gray-400 font-medium mb-1.5">Token efficiency</div>
              <div>Only changed lines (+/-) are sent for analysis — context lines are stripped.</div>
              <div className="mt-1 text-gray-600">
                {diff
                  ? `~${diff.split('\n').filter((l) => l.startsWith('+') || l.startsWith('-')).length} changed lines`
                  : 'No diff loaded'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
