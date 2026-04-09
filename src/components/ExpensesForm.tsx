import { useState, useMemo, type FormEvent } from 'react';
import { Receipt, Plus, Trash2, TrendingDown, Search, Pencil, Fuel } from 'lucide-react';
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
  onUpdate: (id: string, e: Omit<Expense, 'id'>) => void;
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

export function ExpensesForm({ expenses, month, onAdd, onUpdate, onRemove }: Props) {
  const [category, setCategory] = useState<ExpenseCategory>('combustivel');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pricePerLiter, setPricePerLiter] = useState('');

  // Litros calculados automaticamente
  const calculatedLiters = useMemo(() => {
    const a = Number(amount);
    const p = Number(pricePerLiter);
    if (category === 'combustivel' && a > 0 && p > 0) return a / p;
    return 0;
  }, [amount, pricePerLiter, category]);

  function resetForm() {
    setAmount('');
    setDescription('');
    setDate(todayISO());
    setCategory('combustivel');
    setEditingId(null);
    setShowForm(false);
    setPricePerLiter('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    const isFuel = category === 'combustivel';
    const ppl = isFuel ? Number(pricePerLiter) : undefined;
    const liters = isFuel && ppl && ppl > 0 ? Number(amount) / ppl : undefined;
    const data = {
      date,
      category,
      amount: Number(amount),
      description: description.trim(),
      ...(isFuel && ppl ? { pricePerLiter: ppl, liters } : {}),
    };
    if (editingId) {
      onUpdate(editingId, data);
      resetForm();
    } else {
      onAdd(data);
      setAmount('');
      setDescription('');
      setPricePerLiter('');
      setShowForm(false);
    }
  }

  function startEdit(e: Expense) {
    setEditingId(e.id);
    setDate(e.date);
    setCategory(e.category);
    setAmount(String(e.amount));
    setDescription(e.description);
    setPricePerLiter(e.pricePerLiter ? String(e.pricePerLiter) : '');
    setShowForm(true);
  }

  const monthExpenses = useMemo(() => {
    let list = expenses
      .filter((e) => getMonth(e.date) === month)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (filterCategory !== 'all') {
      list = list.filter((e) => e.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          categoryLabels[e.category].toLowerCase().includes(q) ||
          e.date.includes(q) ||
          String(e.amount).includes(q),
      );
    }
    return list;
  }, [expenses, month, filterCategory, searchQuery]);

  const monthTotal = expenses
    .filter((e) => getMonth(e.date) === month)
    .reduce((s, e) => s + e.amount, 0);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <CardTitle className="!mb-0">
          <span className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-red-400" />
            Gastos
          </span>
        </CardTitle>
        <button
          onClick={() => { if (editingId) resetForm(); else setShowForm(!showForm); }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-90 ${
            showForm ? 'bg-slate-700 text-white rotate-45' : 'bg-red-600 text-white shadow-md shadow-red-600/20'
          }`}
          aria-label={showForm ? 'Fechar' : 'Adicionar'}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Resumo rápido */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 sm:px-5 sm:py-3.5">
        <TrendingDown className="h-5 w-5 text-red-400" />
        <div>
          <p className="text-xs text-red-300/70">Total do mês</p>
          <p className="text-lg font-bold text-red-300">{currency(monthTotal)}</p>
        </div>
        <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
          {monthExpenses.length} registro{monthExpenses.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtro e busca */}
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 pl-9 pr-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-red-500/60 transition-all"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | 'all')}
          className="rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 outline-none cursor-pointer"
        >
          <option value="all">Todas</option>
          {categoryOptions.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Formulário toggle */}
      {showForm && (
        <form onSubmit={handleSubmit} className="animate-page mb-4 space-y-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 sm:p-5">
          {editingId && (
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Pencil className="h-3 w-3" /> Editando registro</span>
              <button type="button" onClick={resetForm} className="text-xs text-slate-400 hover:text-white cursor-pointer">Cancelar</button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="exp-date" label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Select id="exp-category" label="Categoria" options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="exp-amount" label={category === 'combustivel' ? 'Valor Total Pago (R$)' : 'Valor (R$)'} type="number" min="0" step="0.01" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input id="exp-desc" label="Descrição" type="text" placeholder="Ex: Posto Shell" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {/* Campos extras para combustível */}
          {category === 'combustivel' && (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <Fuel className="h-3.5 w-3.5" /> Detalhes do abastecimento
              </div>
              <Input id="exp-price-liter" label="Preço por Litro (R$)" type="number" min="0" step="0.01" placeholder="5.89" value={pricePerLiter} onChange={(e) => setPricePerLiter(e.target.value)} />
              {calculatedLiters > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                  <span className="text-xs text-emerald-400 font-medium">Litros abastecidos</span>
                  <span className="text-sm font-bold text-emerald-300">{calculatedLiters.toFixed(2)} L</span>
                </div>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" variant="danger">
            <Plus className="h-4 w-4" /> {editingId ? 'Salvar Alteração' : 'Salvar Gasto'}
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
        <ul className="space-y-2.5 max-h-80 sm:max-h-96 overflow-y-auto">
          {monthExpenses.map((e, i) => (
            <li
              key={e.id}
              className="animate-item flex items-center justify-between gap-3 rounded-xl bg-slate-800/40 px-4 py-3 sm:px-5 sm:py-3.5 text-sm group hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700/50"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                <span className="text-base shrink-0 leading-none">{categoryIcons[e.category]}</span>
                <span className="text-slate-300 text-xs font-medium shrink-0">{categoryLabels[e.category]}</span>
                <span className="text-slate-500 text-xs shrink-0">{e.date.slice(5)}</span>
                {e.category === 'combustivel' && e.liters && (
                  <span className="text-amber-400/70 text-[10px] font-medium shrink-0">{e.liters.toFixed(1)}L</span>
                )}
                {e.description && (
                  <span className="text-slate-600 text-xs truncate max-w-20 hidden sm:inline">{e.description}</span>
                )}
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="font-semibold text-white text-xs sm:text-sm">{currency(e.amount)}</span>
                <button
                  onClick={() => startEdit(e)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-400 transition-all cursor-pointer active:scale-90 sm:opacity-100"
                  aria-label="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {confirmDeleteId === e.id ? (
                  <span className="flex items-center gap-1">
                    <button onClick={() => { onRemove(e.id); setConfirmDeleteId(null); }} className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer">Sim</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer">Não</button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(e.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all cursor-pointer active:scale-90 sm:opacity-100"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
