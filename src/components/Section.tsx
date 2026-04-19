import React, { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
}

const Section: React.FC<SectionProps> = ({ children }) => {
  return <div className="layout-container py-24 lg:py-32">{children}</div>;
};

export default Section;
