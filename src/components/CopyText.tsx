import { useState, useRef } from "react";
import { cn, copyText } from "@/utils/Utils";
import { Check, Copy } from "lucide-react";

const CopyText = ({ id, text }: { id: string; text: string }) => {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-9 w-full items-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 transition-colors focus-within:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus-within:border-zinc-700">
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="text"
        value={text}
        readOnly
        className="h-full flex-1 bg-transparent px-3 text-xs font-medium text-zinc-600 outline-none dark:text-zinc-300"
        onClick={() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }}
      />
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy"}
        className={cn(
          "flex h-full w-10 items-center justify-center border-l border-zinc-200 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800",
          copied ? "text-emerald-500" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        )}
        onClick={() => {
          copyText(text);
          setCopied(true);
          inputRef.current?.focus();
          inputRef.current?.select();
          setTimeout(() => {
            if (inputRef.current) {
              setCopied(false);
            }
          }, 2000);
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
};

export default CopyText;
