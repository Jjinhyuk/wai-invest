import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDateTime } from '@/lib/utils';
import { Users, Shield, User, Calendar } from 'lucide-react';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get all users
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const adminCount = users?.filter(u => u.role === 'admin').length || 0;
  const userCount = users?.filter(u => u.role === 'user').length || 0;

  return (
    <AppShell user={profile || undefined} isAdmin={true}>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-2xl font-bold dark:text-white">사용자 관리</h1>
          <p className="text-muted-foreground">등록된 사용자 목록을 확인합니다</p>
        </div>

        {/* 통계 */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="dark:bg-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                전체 사용자
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                관리자
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{adminCount}</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                일반 사용자
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* 사용자 목록 */}
        <Card className="dark:bg-slate-800">
          <CardHeader>
            <CardTitle>사용자 목록</CardTitle>
            <CardDescription>
              가입일 기준 최신순으로 정렬됩니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!users || users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">등록된 사용자가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => {
                  const initials = u.full_name
                    ? u.full_name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                    : u.email?.[0]?.toUpperCase() || '?';

                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 border rounded-lg dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                          <AvatarFallback className="bg-slate-100 dark:bg-slate-700">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium dark:text-white">
                            {u.full_name || '이름 없음'}
                          </p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            u.role === 'admin'
                              ? 'bg-blue-100 text-blue-700 border-0'
                              : 'bg-slate-100 text-slate-600 border-0'
                          }
                        >
                          {u.role === 'admin' ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              관리자
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              사용자
                            </>
                          )}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(u.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
