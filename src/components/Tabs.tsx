import React from "react";
import classNames from "classnames";

type TabName = string;

export type Tab<TabName> = {
  name: TabName;
  label: string;
  current?: boolean;
  disabled?: boolean;
};

const Tabs = ({
  tabs,
  onChange,
}: {
  tabs: Tab<TabName>[];
  onChange: (current: number) => void;
}) => {
  return (
    <div>
      <div className="lg:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-500 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          defaultValue={tabs.find((tab) => tab.current).name}
          onChange={(event: React.FormEvent<HTMLSelectElement>) => {
            const index: number = tabs.findIndex(
              (tab) => tab.name === event.currentTarget.value
            );
            onChange(index);
          }}
        >
          {tabs
            .filter((tab) => !tab.disabled)
            .map((tab) => (
              <option key={tab.name}>{tab.name}</option>
            ))}
        </select>
      </div>
      <div className="hidden lg:block">
        <div className="border-b border-gray-500">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs
              .filter((tab) => !tab.disabled)
              .map((tab) => (
                <a
                  key={tab.name}
                  role="button"
                  onClick={() => {
                    const index: number = tabs.findIndex(
                      (t) => t.name === tab.name
                    );
                    onChange(index);
                  }}
                  className={classNames(
                    tab.current
                      ? "border-blue-500 text-blue-600 hover:text-blue-600 dark:border-white dark:text-white dark:hover:text-white"
                      : "border-transparent text-gray-600 hover:border-gray-700 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-300 dark:hover:text-gray-300",
                    "select-none whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium no-underline"
                  )}
                  aria-current={tab.current ? "page" : undefined}
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
