import React from 'react';

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="supervisor-layout">
      {/* Minimal layout components for supervisor */}
      <main>{children}</main>
    </div>
  );
} 
