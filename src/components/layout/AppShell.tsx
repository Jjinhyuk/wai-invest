import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  isAdmin?: boolean;
}

export function AppShell({ children, user, isAdmin }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isAdmin={isAdmin} />
      <div className="pl-72">
        <Header user={user} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
