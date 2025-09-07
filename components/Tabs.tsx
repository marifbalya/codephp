// Fix: Changed React import to `import * as React from 'react'` to resolve JSX type errors.
import * as React from 'react';

interface TabButtonProps<T extends string> {
  label: string;
  value: T;
  activeTab: T;
  onClick: (value: T) => void;
}

export function TabButton<T extends string>({ label, value, activeTab, onClick }: TabButtonProps<T>) {
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none ${
        isActive
          ? 'bg-indigo-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
}