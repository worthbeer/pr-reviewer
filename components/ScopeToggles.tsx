'use client';

import type { ReviewScope } from '@/types';

const SCOPES: { value: ReviewScope; label: string; icon: string }[] = [
  { value: 'quality', label: 'Code Quality', icon: '⚡' },
  { value: 'security', label: 'Security', icon: '🔒' },
  { value: 'style', label: 'Style & Conventions', icon: '✨' },
];

interface Props {
  value: ReviewScope[];
  onChange: (scopes: ReviewScope[]) => void;
}

export default function ScopeToggles({ value, onChange }: Props) {
  function toggle(scope: ReviewScope) {
    if (value.includes(scope)) {
      if (value.length === 1) return; // keep at least one
      onChange(value.filter((s) => s !== scope));
    } else {
      onChange([...value, scope]);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Review Scope</label>
      <div className="flex gap-2 flex-wrap">
        {SCOPES.map((s) => {
          const active = value.includes(s.value);
          return (
            <button
              key={s.value}
              onClick={() => toggle(s.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                active
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                  : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
