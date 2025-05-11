import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      {/* Authentication layout components */}
      <main>{children}</main>
    </div>
  );
} 
