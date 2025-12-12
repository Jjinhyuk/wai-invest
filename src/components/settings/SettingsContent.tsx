'use client';

import { useState } from 'react';
import { Bell, Mail, Save, Info } from 'lucide-react';
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
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your alert preferences</p>
      </div>

      {/* Alert settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert Settings
              </CardTitle>
              <CardDescription>
                Configure daily email alerts for stocks matching your criteria
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Alerts</span>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enabled: checked })
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* How it works */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">How alerts work:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Daily scan at 8:00 AM KST for stocks matching your criteria</li>
                  <li>Finds stocks with drawdown from 52-week high within your range</li>
                  <li>Filters by PEG ratio and minimum quality score</li>
                  <li>Sends top 30 matches to your email</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          {/* Drawdown range */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">52-Week Drawdown Range (%)</label>
              <p className="text-xs text-muted-foreground">
                Alert me when stocks fall between these percentages from their 52-week high
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Minimum</label>
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
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Maximum</label>
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
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Example: 20% to 50% means stocks that have fallen 20-50% from their high
            </p>
          </div>

          <Separator />

          {/* PEG max */}
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium">Maximum PEG Ratio</label>
              <p className="text-xs text-muted-foreground">
                Only include stocks with PEG ratio below this value
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
              className="max-w-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              PEG below 1.0 is generally considered undervalued. Default: 1.5
            </p>
          </div>

          <Separator />

          {/* Min score */}
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium">Minimum Quality Score</label>
              <p className="text-xs text-muted-foreground">
                Only include stocks with total score above this threshold
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
              className="max-w-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              Score is based on quality (40%), growth (30%), value (20%), and risk (10%)
            </p>
          </div>

          <Separator />

          {/* Current criteria summary */}
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium mb-2">Current Alert Criteria:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Drawdown: {settings.drawdown_min_percent}% - {settings.drawdown_max_percent}%
              </Badge>
              <Badge variant="outline">PEG &le; {settings.peg_max}</Badge>
              <Badge variant="outline">Score &ge; {settings.min_score}</Badge>
            </div>
          </div>

          {/* Save button */}
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Email notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{userEmail}</p>
              <p className="text-sm text-muted-foreground">
                Alerts will be sent to this email address
              </p>
            </div>
            <Badge variant={settings.enabled ? 'success' : 'secondary'}>
              {settings.enabled ? 'Active' : 'Disabled'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>History of your daily alert emails</CardDescription>
        </CardHeader>
        <CardContent>
          {alertEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts sent yet.</p>
          ) : (
            <div className="space-y-3">
              {alertEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{formatDateTime(event.run_at)}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.matched_count} stocks matched
                    </p>
                  </div>
                  <Badge variant={event.email_sent ? 'success' : 'secondary'}>
                    {event.email_sent ? 'Sent' : 'Not sent'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
