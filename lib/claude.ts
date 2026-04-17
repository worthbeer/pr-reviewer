import Anthropic from '@anthropic-ai/sdk';
import type { ReviewScope, ReviewModel } from '@/types';

export const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SCOPE_INSTRUCTIONS: Record<ReviewScope, string> = {
  quality: `**Code Quality:** Identify logic bugs, dead code, unclear naming, missing edge case handling, and opportunities to simplify complex logic. Flag anti-patterns specific to the language/framework.`,
  security: `**Security:** Look for injection vulnerabilities (SQL, command, XSS), insecure data handling, hardcoded secrets, improper authentication/authorization checks, and OWASP Top 10 issues.`,
  style: `**Style & Conventions:** Flag inconsistent formatting, naming convention violations, missing or incorrect documentation/comments, and deviations from common best practices for the language.`,
};

export function buildSystemPrompt(scopes: ReviewScope[]): string {
  const scopeInstructions = scopes.map((s) => SCOPE_INSTRUCTIONS[s]).join('\n\n');

  return `You are an expert code reviewer. You will be given a unified diff from a pull request. Analyze ONLY the changed lines (lines starting with + or -), not the context lines.

Your review must cover these areas:
${scopeInstructions}

## Output Format

Structure your review as follows:

### Summary
One or two sentences on the overall quality and risk level of this PR.

### Findings
List each issue as:
- **[SCOPE] [SEVERITY]** \`file:line\` — Description and suggested fix.

Severity levels: 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low | ✅ Good (for notable positives)

### Verdict
One of: **Approve** / **Request Changes** / **Needs Discussion** — with a one-line rationale.

Be direct and specific. Reference the actual code from the diff. If the diff is clean, say so briefly.`;
}

export function buildUserMessage(diff: string): string {
  // Trim the diff to focus on signal, not noise
  const lines = diff.split('\n');
  const meaningful = lines.filter(
    (l) =>
      l.startsWith('+') ||
      l.startsWith('-') ||
      l.startsWith('@@') ||
      l.startsWith('diff --git') ||
      l.startsWith('---') ||
      l.startsWith('+++')
  );

  const trimmedDiff = meaningful.join('\n');

  return `Please review this pull request diff:\n\n\`\`\`diff\n${trimmedDiff}\n\`\`\``;
}

export const MODEL_LABELS: Record<ReviewModel, string> = {
  'claude-haiku-4-5': 'Haiku — Fast',
  'claude-sonnet-4-6': 'Sonnet — Deep',
};
