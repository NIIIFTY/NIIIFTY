import { useState, useRef } from "react";
import classNames from "classnames";
import { copyText } from "@/utils/Utils";

const CopyText = ({ id, text }: { id: string; text: string }) => {
  const [copied, setCopied] = useState(false);

  const inputClasses = classNames(
    "border-b border-gray-300 bg-transparent py-2 pl-4 font-light text-gray-600 ring-blue-500 focus:outline-none focus:ring-1 w-9/12 dark:text-white dark:border-gray-500"
  );
  const buttonClasses = classNames(
    "transition duration-300 bg-black hover:bg-white hover:text-black text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring rounded-l-none w-3/12 shadow-md dark:bg-white dark:text-black dark:hover:text-gray-500"
  );

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="text"
        value={text}
        readOnly
        className={inputClasses}
        onClick={() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }}
      />
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy"}
        className={buttonClasses}
        onClick={() => {
          copyText(text);
          setCopied(true);
          inputRef.current?.focus();
          inputRef.current?.select();
          setTimeout(() => {
            // avoid state change on unmounted component
            if (inputRef.current) {
              setCopied(false);
            }
          }, 2000);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </>
  );
};

export default CopyText;
