'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Search, Bell, TrendingUp, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingModalProps {
  userId: string;
  hasPortfolio: boolean;
  hasWatchlist: boolean;
}

const steps = [
  {
    icon: Sparkles,
    title: 'WAI Invest에 오신 것을 환영합니다!',
    description: '미국 주식 분석을 위한 개인 투자 도우미입니다. 몇 가지 단계만 완료하면 바로 시작할 수 있어요.',
    color: 'bg-blue-500',
  },
  {
    icon: Upload,
    title: '1단계: 포트폴리오 등록',
    description: '보유 중인 종목을 CSV/Excel 파일로 업로드하거나, 종목 상세 페이지에서 직접 추가하세요. 수익률과 비중을 한눈에 확인할 수 있습니다.',
    color: 'bg-green-500',
    action: '/portfolio',
    actionLabel: '포트폴리오 관리',
  },
  {
    icon: Search,
    title: '2단계: 종목 탐색',
    description: '스크리너에서 퀄리티, 가치, 턴어라운드 등 전략별로 종목을 검색하세요. PEG, ROE, 고점 대비 하락률 등 핵심 지표를 확인할 수 있습니다.',
    color: 'bg-purple-500',
    action: '/screener',
    actionLabel: '스크리너 열기',
  },
  {
    icon: Bell,
    title: '3단계: 알림 설정',
    description: '원하는 조건(하락률, PEG, 점수)을 설정하면 매일 아침 조건에 맞는 종목을 이메일로 받아볼 수 있습니다.',
    color: 'bg-orange-500',
    action: '/settings',
    actionLabel: '알림 설정',
  },
  {
    icon: TrendingUp,
    title: '준비 완료!',
    description: '이제 대시보드에서 포트폴리오 현황과 알림 후보 종목을 한눈에 확인하세요. 투자 결정에 도움이 되길 바랍니다!',
    color: 'bg-blue-600',
    action: '/dashboard',
    actionLabel: '대시보드로 이동',
  },
];

export function OnboardingModal({ userId, hasPortfolio, hasWatchlist }: OnboardingModalProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // 로컬 스토리지에서 온보딩 완료 여부 확인
    const onboardingCompleted = localStorage.getItem(`onboarding_${userId}`);
    if (!onboardingCompleted && !hasPortfolio && !hasWatchlist) {
      setOpen(true);
    }
  }, [userId, hasPortfolio, hasWatchlist]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    localStorage.setItem(`onboarding_${userId}`, 'true');
    setOpen(false);
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center pt-4">
            <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl">{step.title}</DialogTitle>
            <DialogDescription className="mt-3 text-base leading-relaxed">
              {step.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-6 pt-2">
          {/* Progress indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-blue-500'
                    : index < currentStep
                    ? 'w-2 bg-blue-300'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Checklist for step 0 */}
          {currentStep === 0 && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-4">
              <ChecklistItem
                checked={hasPortfolio}
                label="포트폴리오 등록"
              />
              <ChecklistItem
                checked={hasWatchlist}
                label="관심 종목 추가"
              />
              <ChecklistItem
                checked={false}
                label="알림 조건 설정"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-slate-500"
            >
              건너뛰기
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700 gap-2 flex-1 sm:flex-none"
          >
            {isLastStep ? '시작하기' : '다음'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChecklistItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        checked ? 'bg-green-500' : 'bg-slate-200'
      }`}>
        {checked ? (
          <CheckCircle2 className="w-4 h-4 text-white" />
        ) : (
          <div className="w-2 h-2 bg-slate-400 rounded-full" />
        )}
      </div>
      <span className={checked ? 'text-slate-900' : 'text-slate-500'}>
        {label}
      </span>
    </div>
  );
}
