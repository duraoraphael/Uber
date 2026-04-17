import { useState, useEffect, useCallback } from 'react';
import { Bell, X, Clock } from 'lucide-react';
import { Card, CardTitle } from './ui/Card';

interface Props {
  hasEarningsToday: boolean;
  theme: 'dark' | 'light';
}

const REMINDER_KEY = 'driverfinance_reminder';
const DISMISSED_KEY = 'driverfinance_reminder_dismissed';

interface ReminderConfig {
  enabled: boolean;
  hour: number;
}

function loadConfig(): ReminderConfig {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    return raw ? JSON.parse(raw) : { enabled: false, hour: 20 };
  } catch {
    return { enabled: false, hour: 20 };
  }
}

function saveConfig(config: ReminderConfig) {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(config));
}

export function ReminderBanner({ hasEarningsToday, theme }: Props) {
  const isDark = theme === 'dark';
  const [dismissed, setDismissed] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return localStorage.getItem(DISMISSED_KEY) === today;
  });

  const shouldShow = !hasEarningsToday && !dismissed;

  const dismiss = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(DISMISSED_KEY, today);
    setDismissed(true);
  };

  if (!shouldShow) return null;

  return (
    <div className={`flex items-center gap-3 rounded-2xl p-3.5 border mb-4 animate-item ${
      isDark
        ? 'bg-amber-500/8 border-amber-500/15'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <Bell className="h-5 w-5 text-amber-400 shrink-0 animate-bounce" />
      <div className="flex-1">
        <p className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
          Não registrou ganhos hoje!
        </p>
        <p className={`text-xs ${isDark ? 'text-amber-400/60' : 'text-amber-600/70'}`}>
          Aproveite para anotar seus ganhos enquanto ainda lembra 📝
        </p>
      </div>
      <button
        onClick={dismiss}
        className={`shrink-0 rounded-lg p-1.5 transition-colors cursor-pointer ${
          isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-amber-100 text-amber-400'
        }`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ReminderSettings({ theme }: { theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  const [config, setConfig] = useState<ReminderConfig>(loadConfig);
  const [permStatus, setPermStatus] = useState<string>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermStatus(Notification.permission);
    }
  }, []);

  const toggleReminder = useCallback(async () => {
    if (!config.enabled) {
      if ('Notification' in window && Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        setPermStatus(perm);
        if (perm !== 'granted') return;
      }
    }
    const newConfig = { ...config, enabled: !config.enabled };
    setConfig(newConfig);
    saveConfig(newConfig);
  }, [config]);

  const changeHour = useCallback((hour: number) => {
    const newConfig = { ...config, hour };
    setConfig(newConfig);
    saveConfig(newConfig);
  }, [config]);

  return (
    <Card>
      <CardTitle>
        <span className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-400" />
          Lembretes
        </span>
      </CardTitle>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Lembrete diário
            </p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              Notificação para registrar ganhos
            </p>
          </div>
          <button
            onClick={toggleReminder}
            className={`relative h-7 w-12 rounded-full transition-colors cursor-pointer ${
              config.enabled ? 'bg-emerald-500' : isDark ? 'bg-slate-700' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              config.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {config.enabled && (
          <div className="animate-item">
            <div className="flex items-center gap-2 mb-2">
              <Clock className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Horário do lembrete
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[18, 19, 20, 21, 22].map((h) => (
                <button
                  key={h}
                  onClick={() => changeHour(h)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    config.hour === h
                      ? 'bg-emerald-500 text-white'
                      : isDark
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {h}:00
                </button>
              ))}
            </div>
            {permStatus === 'denied' && (
              <p className="text-xs text-red-400 mt-2">
                ⚠️ Notificações bloqueadas no navegador. Habilite nas configurações do browser.
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
