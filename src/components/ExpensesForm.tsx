import { useState, type FormEvent } from 'react';
import { Receipt, Plus, Trash2, TrendingDown } from 'lucide-react';
import type { Expense, ExpenseCategory } from '../types';
import { Card, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { currency, todayISO } from '../lib/utils';
import { getMonth } from '../lib/calculations';

interface Props {
  expenses: Expense[];
  month: string;
  onAdd: (e: Omit<Expense, 'id'>) => void;
  onRemove: (id: string) => void;
}

const categoryOptions = [
  { value: 'combustivel', label: 'Combustível' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'taxas', label: 'Taxas / Impostos' },
  { value: 'lavagem', label: 'Lavagem' },
  { value: 'outros', label: 'Outros' },
];

const categoryLabels: Record<ExpenseCategory, string> = {
  combustivel: 'Combustível',
  alimentacao: 'Alimentação',
  taxas: 'Taxas',
  lavagem: 'Lavagem',
  outros: 'Outros',
};

const categoryIcons: Record<ExpenseCategory, string> = {
  combustivel: '⛽',
  alimentacao: '🍔',
  taxas: '📋',
  lavagem: '🚿',
  outros: '📦',
};

export function ExpensesForm({ expenses, month, onAdd, onRemove }: Props) {
  const [category, setCategory] = useState<ExpenseCategory>('combustivel');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [showForm, setShowForm] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    onAdd({
      date,
      category,
      amount: Number(amount),
      description: description.trim(),
    });
    setAmount('');
    setDescription('');
    setShowForm(false);
  }

  const monthExpenses = expenses
    .filter((e) => getMonth(e.date) === month)
    .sort((a, b) => b.date.localeCompare(a.date));

  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <CardTitle className="mb-0!">
          <span className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-red-400" />
            Gastos
          </span>
        </CardTitle>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-90 ${
            showForm ? 'bg-slate-700 text-white rotate-45' : 'bg-red-600 text-white shadow-md shadow-red-600/20'
          }`}
          aria-label={showForm ? 'Fechar' : 'Adicionar'}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Resumo rápido */}
      <div className="mb-4 flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-red-500/10 border border-red-500/20 px-3 py-3 sm:px-4 sm:py-3.5">
        <TrendingDown className="h-5 w-5 text-red-400" />
        <div>
          <p className="text-xs text-red-300/70">Total do mês</p>
          <p className="text-lg font-bold text-red-300">{currency(monthTotal)}</p>
        </div>
        <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
          {monthExpenses.length} registro{monthExpenses.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Formulário toggle */}
      {showForm && (
        <form onSubmit={handleSubmit} className="animate-page mb-4 space-y-3 rounded-xl sm:rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input id="exp-date" label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Select id="exp-category" label="Categoria" options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input id="exp-amount" label="Valor (R$)" type="number" min="0" step="0.01" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input id="exp-desc" label="Descrição" type="text" placeholder="Ex: Posto Shell" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" variant="danger">
            <Plus className="h-4 w-4" /> Salvar Gasto
          </Button>
        </form>
      )}

      {/* Lista */}
      {monthExpenses.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Receipt className="mb-2 h-10 w-10 text-slate-700" />
          <p className="text-sm text-slate-500">Nenhum gasto registrado neste mês</p>
          <button onClick={() => setShowForm(true)} className="mt-2 text-sm font-medium text-red-400 hover:text-red-300 cursor-pointer">
            + Adicionar primeiro gasto
          </button>
        </div>
      ) : (
        <ul className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto">
          {monthExpenses.map((e, i) => (
            <li
              key={e.id}
              className="animate-item flex items-center justify-between gap-2 rounded-lg sm:rounded-xl bg-slate-800/50 px-3 py-2.5 sm:px-4 sm:py-3 text-sm group hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700/50"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                <span className="text-base shrink-0 leading-none">{categoryIcons[e.category]}</span>
                <span className="text-slate-300 text-xs font-medium shrink-0">{categoryLabels[e.category]}</span>
                <span className="text-slate-500 text-xs shrink-0">{e.date.slice(5)}</span>
                {e.description && (
                  <span className="text-slate-600 text-xs truncate max-w-20 hidden sm:inline">{e.description}</span>
                )}
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
