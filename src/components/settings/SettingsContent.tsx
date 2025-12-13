'use client';

import { useState } from 'react';
import { Bell, Mail, Save, Info, Settings, TrendingDown, Target, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDateTime } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { AlertSettings, AlertEvent } from '@/types/database';

interface SettingsContentProps {
  alertSettings: AlertSettings;
  alertEvents: AlertEvent[];
  userEmail: string;
}

export function SettingsContent({
  alertSettings: initialSettings,
  alertEvents,
  userEmail,
}: SettingsContentProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await supabase
        .from('alert_settings')
        .update({
          enabled: settings.enabled,
          drawdown_min_percent: settings.drawdown_min_percent,
          drawdown_max_percent: settings.drawdown_max_percent,
          peg_max: settings.peg_max,
          min_score: settings.min_score,
        })
        .eq('user_id', settings.user_id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">설정</h1>
        <p className="text-slate-500 mt-1">알림 및 계정 설정을 관리하세요</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main settings - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alert settings */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    알림 설정
                  </CardTitle>
                  <CardDescription className="mt-2">
                    조건에 맞는 종목을 매일 이메일로 받아보세요
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl">
                  <span className="text-sm font-medium text-slate-600">알림 {settings.enabled ? '켜짐' : '꺼짐'}</span>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, enabled: checked })
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* How it works */}
              <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 mb-2">알림 작동 방식</p>
                    <ul className="text-blue-700 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                        매일 오전 8시(KST)에 조건에 맞는 종목 검색
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingDown className="h-4 w-4 mt-0.5 shrink-0" />
                        52주 고점 대비 설정한 범위 내 하락한 종목 탐색
                      </li>
                      <li className="flex items-start gap-2">
                        <Target className="h-4 w-4 mt-0.5 shrink-0" />
                        PEG 비율과 최소 품질 점수로 필터링
                      </li>
                      <li className="flex items-start gap-2">
                        <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                        상위 30개 종목을 이메일로 발송
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Drawdown range */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-900">52주 고점 대비 하락률 범위 (%)</label>
                  <p className="text-sm text-slate-500 mt-1">
                    고점에서 설정한 범위만큼 하락한 종목을 알림받습니다
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">최소</label>
                    <Input
                      type="number"
                      value={settings.drawdown_min_percent}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          drawdown_min_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                      min={0}
                      max={100}
                      className="h-12 text-lg font-semibold"
                    />
                  </div>
                  <div className="flex items-end pb-3 text-slate-400">~</div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">최대</label>
                    <Input
                      type="number"
                      value={settings.drawdown_max_percent}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          drawdown_max_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                      min={0}
                      max={100}
                      className="h-12 text-lg font-semibold"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
                  💡 예시: 20% ~ 50% 설정 시, 고점 대비 20-50% 하락한 종목을 알림받습니다
                </p>
              </div>

              <Separator />

              {/* PEG max */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-slate-900">최대 PEG 비율</label>
                  <p className="text-sm text-slate-500 mt-1">
                    이 값 이하의 PEG 비율을 가진 종목만 포함합니다
                  </p>
                </div>
                <Input
                  type="number"
                  value={settings.peg_max}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      peg_max: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  step={0.1}
                  className="max-w-[180px] h-12 text-lg font-semibold"
                />
                <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
                  💡 PEG 1.0 미만은 일반적으로 저평가로 간주됩니다. 기본값: 1.5
                </p>
              </div>

              <Separator />

              {/* Min score */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-slate-900">최소 품질 점수</label>
                  <p className="text-sm text-slate-500 mt-1">
                    이 점수 이상의 종목만 알림에 포함됩니다
                  </p>
                </div>
                <Input
                  type="number"
                  value={settings.min_score}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      min_score: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={100}
                  className="max-w-[180px] h-12 text-lg font-semibold"
                />
                <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
                  💡 점수는 퀄리티(40%), 성장(30%), 가치(20%), 리스크(10%) 기준으로 산출됩니다
                </p>
              </div>

              <Separator />

              {/* Current criteria summary */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-900 mb-3">현재 알림 조건</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1.5">
                    하락률: {settings.drawdown_min_percent}% - {settings.drawdown_max_percent}%
                  </Badge>
                  <Badge className="bg-green-100 text-green-700 border-0 px-3 py-1.5">
                    PEG ≤ {settings.peg_max}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-700 border-0 px-3 py-1.5">
                    점수 ≥ {settings.min_score}점
                  </Badge>
                </div>
              </div>

              {/* Save button */}
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700">
                {saved ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    저장 완료!
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    {isSaving ? '저장 중...' : '설정 저장'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Email notification */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-green-600" />
                </div>
                알림 수신 이메일
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                <p className="font-semibold text-slate-900">{userEmail}</p>
                <p className="text-sm text-slate-500">
                  알림이 위 이메일 주소로 발송됩니다
                </p>
                <Badge className={settings.enabled ? 'bg-green-100 text-green-700 border-0' : 'bg-slate-100 text-slate-600 border-0'}>
                  {settings.enabled ? '활성화됨' : '비활성화됨'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent alerts */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg">최근 알림 내역</CardTitle>
              <CardDescription>발송된 일일 알림 이메일 기록</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {alertEvents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-7 w-7 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">아직 발송된 알림이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{formatDateTime(event.run_at)}</p>
                        <p className="text-sm text-slate-500">
                          {event.matched_count}개 종목 매칭
                        </p>
                      </div>
                      <Badge className={event.email_sent ? 'bg-green-100 text-green-700 border-0' : 'bg-slate-200 text-slate-600 border-0'}>
                        {event.email_sent ? '발송됨' : '미발송'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
