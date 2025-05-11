import React from 'react';

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="operator-layout">
      {/* Sidebar and other layout components would go here */}
      <main>{children}</main>
    </div>
  );
} 
