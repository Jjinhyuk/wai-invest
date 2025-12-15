'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AdminModeProvider } from '@/contexts/AdminModeContext';

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role?: string;
  };
  isAdmin?: boolean;
}

export function AppShell({ children, user, isAdmin = false }: AppShellProps) {
  return (
    <AdminModeProvider isAdmin={isAdmin}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <Sidebar isAdmin={isAdmin} />
        <div className="pl-72">
          <Header user={user} isAdmin={isAdmin} />
          <main className="p-8">{children}</main>
        </div>
      </div>
    </AdminModeProvider>
  );
}
