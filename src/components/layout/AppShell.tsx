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
    <div className="min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} />
      <div className="pl-64">
        <Header user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
