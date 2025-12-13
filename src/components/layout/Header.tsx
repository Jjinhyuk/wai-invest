'use client';

import { Bell, Search, ChevronDown, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  user?: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/stocks/${searchQuery.trim().toUpperCase()}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 transition-colors">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-lg">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder="종목 검색 (예: AAPL, MSFT, GOOGL)..."
          className="pl-11 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-700 transition-colors dark:text-white dark:placeholder:text-slate-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
          <Avatar className="h-10 w-10 ring-2 ring-slate-100 dark:ring-slate-700">
            {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
            <AvatarFallback className="bg-blue-600 text-white font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
              {user?.full_name || '사용자'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {user?.email}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
        </div>
      </div>
    </header>
  );
}
