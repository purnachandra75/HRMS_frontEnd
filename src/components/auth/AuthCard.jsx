import React from 'react';
import { Users } from 'lucide-react';
import '../../styles/tailwind.css';
import './auth.css';

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="auth-tailwind-root flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card p-8 shadow-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Users className="size-6" />
          </div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">Employee Management System</h1>
          {title && <h2 className="mt-3 text-lg font-semibold text-foreground">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
