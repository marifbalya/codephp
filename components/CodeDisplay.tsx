// Fix: Changed React import to `import * as React from 'react'` to resolve JSX type errors.
import * as React from 'react';

interface CodeDisplayProps {
  code: string;
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ code }) => {
  return (
    <div className="relative bg-[#1e293b] text-[#e2e8f0] h-full w-full overflow-auto rounded-b-md">
      <pre className="p-4 text-sm whitespace-pre-wrap break-words w-full h-full">
        <code className="language-php">{code}</code>
      </pre>
    </div>
  );
};

export default CodeDisplay;