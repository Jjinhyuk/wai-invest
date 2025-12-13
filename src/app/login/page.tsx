'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TrendingUp, Shield, Bell, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: TrendingUp,
      title: '스마트 스크리너',
      description: '퀄리티, 성장, 가치, 리스크 기반 종합 스코어링',
    },
    {
      icon: PieChart,
      title: '포트폴리오 관리',
      description: '보유 종목 추적 및 수익률 분석',
    },
    {
      icon: Bell,
      title: '맞춤 알림',
      description: '관심 조건 충족 시 매일 이메일 알림',
    },
    {
      icon: Shield,
      title: '리스크 분석',
      description: '베타, 부채비율, 유동성 등 위험 지표 모니터링',
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">WAI-Invest</span>
          </div>
          <p className="text-blue-100 mt-2 text-sm">미국 주식 분석 플랫폼</p>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              데이터 기반의<br />
              스마트한 투자 결정
            </h1>
            <p className="text-blue-100 mt-4 text-lg">
              종합 스코어링, 포트폴리오 관리, 맞춤 알림까지<br />
              당신의 투자를 더 쉽고 현명하게
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <feature.icon className="w-8 h-8 text-blue-200 mb-3" />
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="text-blue-200 text-sm mt-1">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-200 text-sm">
          © 2024 WAI-Invest. All rights reserved.
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">WAI-Invest</span>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">로그인</h2>
                <p className="text-slate-500 mt-2">
                  Google 계정으로 간편하게 시작하세요
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center">
                    로그인에 실패했습니다. 다시 시도해주세요.
                  </p>
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-medium gap-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isLoading ? '로그인 중...' : 'Google 계정으로 계속하기'}
              </Button>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">
                  계속 진행하면 <span className="text-slate-600">서비스 약관</span> 및{' '}
                  <span className="text-slate-600">개인정보 처리방침</span>에 동의하게 됩니다
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center lg:hidden">
            <p className="text-slate-500 text-sm">
              미국 주식 분석 • 포트폴리오 관리 • 맞춤 알림
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
