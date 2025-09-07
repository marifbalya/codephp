// Fix: Changed React import to `import * as React from 'react'` to resolve JSX type errors.
import * as React from 'react';

interface PreviewDisplayProps {
  htmlContent: string;
}

const PreviewDisplay: React.FC<PreviewDisplayProps> = ({ htmlContent }) => {
  // Use a simple dark background to avoid a white flash before content loads
  const srcDoc = htmlContent || `<html style="background-color: #1f2937;"></html>`;
  return (
    <div className="bg-[#1f2937] rounded-lg h-full w-full">
      <iframe
        srcDoc={srcDoc}
        title="PHP Output Preview"
        className="w-full h-full border-0 rounded-lg bg-white"
        sandbox="allow-scripts"
      />
    </div>
  );
};

export default PreviewDisplay;