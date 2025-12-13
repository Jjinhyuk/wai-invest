'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Briefcase,
  Settings,
  Shield,
  TrendingUp,
  LogOut,
  Database,
  Users,
  ChevronRight,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  description?: string;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: '대시보드',
    icon: LayoutDashboard,
    description: '요약 및 알림'
  },
  {
    href: '/screener',
    label: '스크리너',
    icon: Search,
    description: '종목 검색 및 필터'
  },
  {
    href: '/watchlist',
    label: '관심 종목',
    icon: Star,
    description: '추적 중인 종목'
  },
  {
    href: '/portfolio',
    label: '포트폴리오',
    icon: Briefcase,
    description: '보유 종목 관리'
  },
  {
    href: '/settings',
    label: '설정',
    icon: Settings,
    description: '알림 및 계정 설정'
  },
];

const adminItems: NavItem[] = [
  {
    href: '/admin',
    label: '관리자 홈',
    icon: Shield,
    description: '관리자 대시보드'
  },
  {
    href: '/admin/data',
    label: '데이터 관리',
    icon: Database,
    description: '종목 및 지표 관리'
  },
  {
    href: '/admin/users',
    label: '사용자 관리',
    icon: Users,
    description: '회원 목록 조회'
  },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-slate-900 text-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-slate-700">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">WAI-Invest</span>
              <p className="text-xs text-slate-400">미국 주식 분석</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          {/* Main Menu */}
          <div className="mb-8">
            <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              메인 메뉴
            </p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <div className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
                      isActive ? 'bg-blue-500' : 'bg-slate-800 group-hover:bg-slate-700'
                    )}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.label}</p>
                      <p className={cn(
                        'text-xs',
                        isActive ? 'text-blue-200' : 'text-slate-500'
                      )}>
                        {item.description}
                      </p>
                    </div>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-blue-200" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Admin Menu */}
          {isAdmin && (
            <div>
              <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                관리자
              </p>
              <div className="space-y-1">
                {adminItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
                        isActive ? 'bg-orange-500' : 'bg-slate-800 group-hover:bg-slate-700'
                      )}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className={cn(
                          'text-xs',
                          isActive ? 'text-orange-200' : 'text-slate-500'
                        )}>
                          {item.description}
                        </p>
                      </div>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-orange-200" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl py-3"
            onClick={handleSignOut}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="font-medium">로그아웃</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
