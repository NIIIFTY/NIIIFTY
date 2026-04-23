import React from 'react';
import classNames from 'classnames';

type TabName = string;

export type Tab<TabName> = {
  name: TabName;
  label: string;
  current?: boolean;
  disabled?: boolean;
};

const Tabs = ({ tabs, onChange, disabled }: { tabs: Tab<TabName>[]; onChange: (current: number) => void; disabled?: boolean }) => {
  return (
    <div className={classNames(disabled && "opacity-50 pointer-events-none")}>
      <div className="xl:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          disabled={disabled}
          className="block w-full border-zinc-200 py-2 pr-10 pl-3 text-zinc-600 focus:border-zinc-500 focus:ring-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white"
          defaultValue={tabs.find((tab) => tab.current)?.name}
          onChange={(event: React.FormEvent<HTMLSelectElement>) => {
            const index: number = tabs.findIndex((tab) => tab.name === event.currentTarget.value);
            onChange(index);
          }}
        >
          {tabs
            .map((tab) => (
              <option key={tab.name} disabled={tab.disabled}>{tab.name}</option>
            ))}
        </select>
      </div>
      <div className="hidden xl:block">
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs
              .map((tab) => (
                <a
                  key={tab.name}
                  role="button"
                  onClick={() => {
                    if (!disabled && !tab.disabled) {
                      const index: number = tabs.findIndex((t) => t.name === tab.name);
                      onChange(index);
                    }
                  }}
                  className={classNames(
                    tab.current
                      ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                      : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300',
                    (disabled || tab.disabled) && 'opacity-50 cursor-not-allowed grayscale',
                    'border-b-2 px-1 pb-3 text-xs font-semibold whitespace-nowrap no-underline select-none transition-colors',
                  )}
                  aria-current={tab.current ? 'page' : undefined}
                >
                  {tab.label}
                </a>
              ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Tabs;
