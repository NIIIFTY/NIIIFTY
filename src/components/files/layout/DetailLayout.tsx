import React, { ReactNode } from 'react';
import Section from '@/components/Section';

interface DetailLayoutProps {
  header: ReactNode;
  mainContent: ReactNode;
  sidebarContent: ReactNode;
}

export function DetailLayout({ header, mainContent, sidebarContent }: DetailLayoutProps) {
  return (
    <Section>
      <div className="relative w-full">
        {header}
        <div className="grid grid-cols-1 gap-12 xl:grid-cols-12">
          {/* Main Content Column */}
          <div className="xl:col-span-7 space-y-12">
            {mainContent}
          </div>

          {/* Sidebar Column */}
          <aside className="xl:col-span-5 space-y-8">
            {sidebarContent}
          </aside>
        </div>
      </div>
    </Section>
  );
}
