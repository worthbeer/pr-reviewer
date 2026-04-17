'use client';

import type { ReviewModel } from '@/types';

const MODELS: { value: ReviewModel; label: string; description: string }[] = [
  {
    value: 'claude-haiku-4-5',
    label: 'Haiku',
    description: 'Fast · Low cost',
  },
  {
    value: 'claude-sonnet-4-6',
    label: 'Sonnet',
    description: 'Deep analysis · Higher accuracy',
  },
];

interface Props {
  value: ReviewModel;
  onChange: (model: ReviewModel) => void;
}

export default function ModelSwitcher({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
      <div className="flex gap-2">
        {MODELS.map((m) => (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`flex-1 px-3 py-2 rounded-md border text-sm transition-colors ${
              value === m.value
                ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
            }`}
          >
            <div className="font-medium">{m.label}</div>
            <div className="text-xs mt-0.5 opacity-70">{m.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
