import { useState, type FormEvent } from 'react';
import { X, DollarSign, Receipt, TrendingUp, TrendingDown } from 'lucide-react';
import type { Earning, Expense, Platform, ExpenseCategory } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { todayISO } from '../lib/utils';

type Mode = 'earning' | 'expense';

interface Props {
  open: boolean;
  onClose: () => void;
  onAddEarning: (e: Omit<Earning, 'id'>) => void;
  onAddExpense: (e: Omit<Expense, 'id'>) => void;
}

const platformOptions = [
  { value: 'uber', label: 'Uber' },
  { value: '99', label: '99' },
  { value: 'outros', label: 'Outros' },
];

const categoryOptions = [
  { value: 'combustivel', label: 'Combustível' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'taxas', label: 'Taxas / Impostos' },
  { value: 'lavagem', label: 'Lavagem' },
  { value: 'outros', label: 'Outros' },
];

export function QuickAddModal({ open, onClose, onAddEarning, onAddExpense }: Props) {
  const [mode, setMode] = useState<Mode>('earning');
  const [date, setDate] = useState(todayISO());

  // Earning fields
  const [platform, setPlatform] = useState<Platform>('uber');
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState('');
  const [km, setKm] = useState('');

  // Expense fields
  const [category, setCategory] = useState<ExpenseCategory>('combustivel');
  const [expAmount, setExpAmount] = useState('');
  const [description, setDescription] = useState('');

  function resetForm() {
    setAmount('');
    setHours('');
    setKm('');
    setExpAmount('');
    setDescription('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'earning') {
      if (!amount || Number(amount) <= 0) return;
      onAddEarning({
        date,
        platform,
        amount: Number(amount),
        hours: Number(hours) || 0,
        km: Number(km) || 0,
      });
    } else {
      if (!expAmount || Number(expAmount) <= 0) return;
      onAddExpense({
        date,
        category,
        amount: Number(expAmount),
        description: description.trim(),
      });
    }
    resetForm();
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/60 animate-overlay" onClick={onClose} />

      {/* Modal - Sheet em mobile, centralizado em desktop */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:max-h-[85dvh]">
        <div className="animate-sheet sm:animate-modal rounded-t-2xl sm:rounded-3xl border border-slate-700/50 bg-slate-900 p-4 sm:p-7 shadow-2xl shadow-black/40 overflow-y-auto max-h-[90dvh] sm:max-h-[85dvh] safe-bottom">
          {/* Handle bar (mobile) */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-700 sm:hidden" />

          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Adicionar Registro</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white cursor-pointer transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Toggle Ganho / Gasto */}
          <div className="mb-4 flex rounded-xl sm:rounded-2xl bg-slate-800 p-1 border border-slate-700/50">
            <button
              onClick={() => setMode('earning')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                mode === 'earning'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Ganho
            </button>
            <button
              onClick={() => setMode('expense')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                mode === 'expense'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="h-4 w-4" />
              Gasto
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input id="qa-date" label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

            {mode === 'earning' ? (
              <>
                <Select id="qa-platform" label="Plataforma" options={platformOptions} value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Input id="qa-amount" label="Valor (R$)" type="number" min="0" step="0.01" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <Input id="qa-hours" label="Horas" type="number" min="0" step="0.1" placeholder="0" value={hours} onChange={(e) => setHours(e.target.value)} />
                  <Input id="qa-km" label="KM" type="number" min="0" step="1" placeholder="0" value={km} onChange={(e) => setKm(e.target.value)} className="col-span-2 sm:col-span-1" />
                </div>
              </>
            ) : (
              <>
                <Select id="qa-cat" label="Categoria" options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} />
                <Input id="qa-expamount" label="Valor (R$)" type="number" min="0" step="0.01" placeholder="0,00" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} />
                <Input id="qa-desc" label="Descrição (opcional)" type="text" placeholder="Ex: Posto Shell" value={description} onChange={(e) => setDescription(e.target.value)} />
              </>
            )}

            <Button type="submit" className="w-full py-3 text-base mt-2">
              {mode === 'earning' ? (
                <><DollarSign className="h-5 w-5" /> Salvar Ganho</>
              ) : (
                <><Receipt className="h-5 w-5" /> Salvar Gasto</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
