import React from "react";

const CodeBlock = ({ children }: { children?: React.ReactNode }) => {
  return (
    <code className="whitespace-pre-wrap break-words bg-gray-200 px-1 py-1 dark:bg-gray-700">
      {children}
    </code>
  );
};

export default CodeBlock;
