'use client';

interface Props {
  review: string;
  isStreaming: boolean;
}

export default function ReviewPanel({ review, isStreaming }: Props) {
  if (!review && !isStreaming) return null;

  return (
    <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800">
        <span className="text-sm font-medium text-gray-300">Review</span>
        {isStreaming && (
          <span className="flex items-center gap-1.5 text-xs text-indigo-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Analyzing…
          </span>
        )}
      </div>
      <div className="p-4 prose prose-invert prose-sm max-w-none">
        <pre className="whitespace-pre-wrap font-sans text-gray-200 text-sm leading-relaxed">
          {review}
          {isStreaming && <span className="inline-block w-0.5 h-4 bg-indigo-400 animate-pulse ml-0.5 align-text-bottom" />}
        </pre>
      </div>
    </div>
  );
}
