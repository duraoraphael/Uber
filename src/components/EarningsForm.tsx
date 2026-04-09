import { useState, type FormEvent } from 'react';
import { DollarSign, Plus, Trash2, TrendingUp } from 'lucide-react';
import type { Earning, Platform } from '../types';
import { Card, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { currency, todayISO } from '../lib/utils';
import { getMonth } from '../lib/calculations';

interface Props {
  earnings: Earning[];
  month: string;
  onAdd: (e: Omit<Earning, 'id'>) => void;
  onRemove: (id: string) => void;
}

const platformOptions = [
  { value: 'uber', label: 'Uber' },
  { value: '99', label: '99' },
  { value: 'outros', label: 'Outros' },
];

const platformColors: Record<Platform, string> = {
  uber: 'bg-white/90 text-gray-900',
  '99': 'bg-amber-400/90 text-amber-950',
  outros: 'bg-blue-400/90 text-blue-950',
};

export function EarningsForm({ earnings, month, onAdd, onRemove }: Props) {
  const [platform, setPlatform] = useState<Platform>('uber');
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState('');
  const [km, setKm] = useState('');
  const [date, setDate] = useState(todayISO());
  const [showForm, setShowForm] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    onAdd({
      date,
      platform,
      amount: Number(amount),
      hours: Number(hours) || 0,
      km: Number(km) || 0,
    });
    setAmount('');
    setHours('');
    setKm('');
    setShowForm(false);
  }

  const monthEarnings = earnings
    .filter((e) => getMonth(e.date) === month)
    .sort((a, b) => b.date.localeCompare(a.date));

  const monthTotal = monthEarnings.reduce((s, e) => s + e.amount, 0);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <CardTitle className="mb-0!">
          <span className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            Ganhos
          </span>
        </CardTitle>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-90 ${
            showForm ? 'bg-slate-700 text-white rotate-45' : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
          }`}
          aria-label={showForm ? 'Fechar' : 'Adicionar'}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Resumo rápido do mês */}
      <div className="mb-4 flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-3 sm:px-4 sm:py-3.5">
        <TrendingUp className="h-5 w-5 text-emerald-400" />
        <div>
          <p className="text-xs text-emerald-300/70">Total do mês</p>
          <p className="text-lg font-bold text-emerald-300">{currency(monthTotal)}</p>
        </div>
        <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
          {monthEarnings.length} registro{monthEarnings.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Formulário inline toggle */}
      {showForm && (
        <form onSubmit={handleSubmit} className="animate-page mb-4 space-y-3 rounded-xl sm:rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input id="earn-date" label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Select id="earn-platform" label="Plataforma" options={platformOptions} value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Input id="earn-amount" label="Valor (R$)" type="number" min="0" step="0.01" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input id="earn-hours" label="Horas" type="number" min="0" step="0.5" placeholder="0" value={hours} onChange={(e) => setHours(e.target.value)} />
            <Input id="earn-km" label="KM" type="number" min="0" step="1" placeholder="0" value={km} onChange={(e) => setKm(e.target.value)} className="col-span-2 sm:col-span-1" />
          </div>
          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4" /> Salvar Ganho
          </Button>
        </form>
      )}

      {/* Lista */}
      {monthEarnings.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <DollarSign className="mb-2 h-10 w-10 text-slate-700" />
          <p className="text-sm text-slate-500">Nenhum ganho registrado neste mês</p>
          <button onClick={() => setShowForm(true)} className="mt-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer">
            + Adicionar primeiro ganho
          </button>
        </div>
      ) : (
        <ul className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto">
          {monthEarnings.map((e, i) => (
            <li
              key={e.id}
              className="animate-item flex items-center justify-between gap-2 rounded-lg sm:rounded-xl bg-slate-800/50 px-3 py-2.5 sm:px-4 sm:py-3 text-sm group hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700/50"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase leading-tight ${platformColors[e.platform]}`}>
                  {e.platform}
                </span>
                <span className="text-slate-400 text-xs shrink-0">{e.date.slice(5)}</span>
                {e.hours > 0 && <span className="text-slate-600 text-xs hidden sm:inline">{e.hours}h</span>}
                {e.km > 0 && <span className="text-slate-600 text-xs hidden sm:inline">{e.km}km</span>}
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="font-semibold text-white text-xs sm:text-sm">{currency(e.amount)}</span>
                <button
                  onClick={() => onRemove(e.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all cursor-pointer active:scale-90 sm:opacity-100"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
