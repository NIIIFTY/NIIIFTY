import React from "react";

const CodeBlock = ({ children }: { children?: React.ReactNode }) => {
  return (
    <pre className="rounded bg-gray-900 p-2 font-mono text-base text-white dark:bg-gray-700 md:p-4">
      <code className="whitespace-pre-wrap break-words">{children}</code>
    </pre>
  );
};

export default CodeBlock;
