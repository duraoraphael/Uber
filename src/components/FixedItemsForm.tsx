import { useState, type FormEvent } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, Pencil } from 'lucide-react';
import type { FixedItem, FixedItemType } from '../types';
import { Card, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { currency } from '../lib/utils';

interface Props {
  fixedItems: FixedItem[];
  onAdd: (item: Omit<FixedItem, 'id'>) => void;
  onUpdate: (id: string, item: Omit<FixedItem, 'id'>) => void;
  onToggle: (id: string, active: boolean) => void;
  onRemove: (id: string) => void;
}

const expenseCategories = [
  { value: 'moradia', label: 'Moradia/Aluguel' },
  { value: 'transporte', label: 'Transporte/Financiamento' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'servicos', label: 'Internet/Telefone' },
  { value: 'assinaturas', label: 'Assinaturas' },
  { value: 'saude', label: 'Saúde/Plano' },
  { value: 'educacao', label: 'Educação' },
  { value: 'outros', label: 'Outros' },
];

const incomeCategories = [
  { value: 'salario', label: 'Salário' },
  { value: 'aluguel_recebido', label: 'Aluguel recebido' },
  { value: 'pensao', label: 'Pensão/Aposentadoria' },
  { value: 'investimento', label: 'Investimentos' },
  { value: 'outros', label: 'Outros' },
];

export function FixedItemsForm({ fixedItems, onAdd, onUpdate, onToggle, onRemove }: Props) {
  const [activeType, setActiveType] = useState<FixedItemType>('expense');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('outros');
  const [formType, setFormType] = useState<FixedItemType>('expense');

  function resetForm() {
    setName('');
    setAmount('');
    setCategory('outros');
    setFormType(activeType);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(item: FixedItem) {
    setEditingId(item.id);
    setName(item.name);
    setAmount(String(item.amount));
    setCategory(item.category);
    setFormType(item.type);
    setShowForm(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount || Number(amount) <= 0) return;
    const existing = editingId ? fixedItems.find((i) => i.id === editingId) : null;
    const payload: Omit<FixedItem, 'id'> = {
      type: formType,
      name: name.trim(),
      amount: Number(amount),
      category,
      active: existing?.active ?? true,
    };
    if (editingId) {
      onUpdate(editingId, payload);
    } else {
      onAdd(payload);
    }
    resetForm();
  }

  const categories = formType === 'expense' ? expenseCategories : incomeCategories;
  const filteredItems = fixedItems.filter((i) => i.type === activeType);
  const activeTotal = filteredItems.filter((i) => i.active).reduce((s, i) => s + i.amount, 0);
  const inactiveCount = filteredItems.filter((i) => !i.active).length;

  const totalIncome = fixedItems.filter((i) => i.type === 'income' && i.active).reduce((s, i) => s + i.amount, 0);
  const totalExpense = fixedItems.filter((i) => i.type === 'expense' && i.active).reduce((s, i) => s + i.amount, 0);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <CardTitle className="!mb-0">
          <span className="flex items-center gap-2">
            {activeType === 'expense'
              ? <TrendingDown className="h-5 w-5 text-red-400" />
              : <TrendingUp className="h-5 w-5 text-emerald-400" />
            }
            Fixos Mensais
          </span>
        </CardTitle>
        <button
          onClick={() => {
            if (editingId) resetForm();
            else { setFormType(activeType); setShowForm(!showForm); }
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-90 ${
            showForm
              ? 'bg-slate-700 text-white rotate-45'
              : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
          }`}
          aria-label={showForm ? 'Fechar' : 'Adicionar'}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Resumo receitas / despesas */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
          <p className="text-xs text-emerald-300/70">Receitas fixas</p>
          <p className="text-base font-bold text-emerald-300">{currency(totalIncome)}</p>
        </div>
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-3 py-2.5">
          <p className="text-xs text-red-300/70">Despesas fixas</p>
          <p className="text-base font-bold text-red-300">{currency(totalExpense)}</p>
        </div>
      </div>

      {/* Abas de tipo */}
      <div className="mb-3 flex overflow-hidden rounded-xl border border-slate-700/50">
        <button
          onClick={() => setActiveType('expense')}
          className={`flex-1 py-2 text-sm font-medium transition-all cursor-pointer ${
            activeType === 'expense'
              ? 'bg-red-500/15 text-red-400 border-b-2 border-red-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Despesas ({fixedItems.filter((i) => i.type === 'expense' && i.active).length})
        </button>
        <button
          onClick={() => setActiveType('income')}
          className={`flex-1 py-2 text-sm font-medium transition-all cursor-pointer ${
            activeType === 'income'
              ? 'bg-emerald-500/15 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Receitas ({fixedItems.filter((i) => i.type === 'income' && i.active).length})
        </button>
      </div>

      {/* Formulário inline */}
      {showForm && (
        <form onSubmit={handleSubmit} className="animate-page mb-4 space-y-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4">
          {editingId && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                <Pencil className="h-3 w-3" /> Editando item
              </span>
              <button type="button" onClick={resetForm} className="text-xs text-slate-400 hover:text-white cursor-pointer">
                Cancelar
              </button>
            </div>
          )}
          {/* Seletor de tipo dentro do form */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setFormType('expense'); setCategory('outros'); }}
              className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all cursor-pointer ${
                formType === 'expense'
                  ? 'bg-red-500/20 text-red-400 ring-1 ring-red-400/50'
                  : 'bg-slate-700/50 text-slate-400'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => { setFormType('income'); setCategory('outros'); }}
              className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all cursor-pointer ${
                formType === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/50'
                  : 'bg-slate-700/50 text-slate-400'
              }`}
            >
              Receita
            </button>
          </div>
          <Input
            id="fixed-name"
            label="Nome"
            placeholder="Ex: Aluguel, Netflix, Salário..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="fixed-amount"
              label="Valor mensal (R$)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Select
              id="fixed-category"
              label="Categoria"
              options={categories}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4" /> {editingId ? 'Salvar Alteração' : 'Adicionar'}
          </Button>
        </form>
      )}

      {/* Lista */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center py-7 text-center">
          {activeType === 'expense'
            ? <TrendingDown className="mb-2 h-9 w-9 text-slate-700" />
            : <TrendingUp className="mb-2 h-9 w-9 text-slate-700" />
          }
          <p className="text-sm text-slate-500">
            Nenhuma {activeType === 'expense' ? 'despesa' : 'receita'} fixa cadastrada
          </p>
          <button
            onClick={() => { setFormType(activeType); setCategory('outros'); setShowForm(true); }}
            className="mt-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            + Adicionar primeiro
          </button>
        </div>
      ) : (
        <>
          {inactiveCount > 0 && (
            <p className="mb-2 text-xs text-slate-500">{inactiveCount} item(s) pausado(s) — não contabilizado(s)</p>
          )}
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {filteredItems.map((item, i) => (
              <li
                key={item.id}
                style={{ animationDelay: `${i * 30}ms` }}
                className={`animate-item group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all border ${
                  item.active
                    ? 'bg-slate-800/40 border-transparent hover:border-slate-700/50'
                    : 'bg-slate-900/20 border-dashed border-slate-700/30 opacity-60'
                }`}
              >
                {/* Toggle ativo */}
                <button
                  onClick={() => onToggle(item.id, !item.active)}
                  title={item.active ? 'Pausar' : 'Ativar'}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-all cursor-pointer ${
                    item.active
                      ? activeType === 'expense' ? 'bg-red-500' : 'bg-emerald-500'
                      : 'bg-slate-700'
                  }`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${item.active ? 'left-4' : 'left-0.5'}`} />
                </button>

                <span className="min-w-0 flex-1 truncate font-medium text-slate-200">{item.name}</span>

                <span className={`shrink-0 text-xs font-bold ${
                  item.active
                    ? activeType === 'expense' ? 'text-red-400' : 'text-emerald-400'
                    : 'text-slate-500'
                }`}>
                  {currency(item.amount)}
                </span>

                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-all group-hover:opacity-100 sm:opacity-100">
                  <button
                    onClick={() => startEdit(item)}
                    className="cursor-pointer text-slate-500 hover:text-blue-400 active:scale-90"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {confirmDeleteId === item.id ? (
                    <span className="flex items-center gap-1">
                      <button
                        onClick={() => { onRemove(item.id); setConfirmDeleteId(null); }}
                        className="cursor-pointer text-[10px] font-bold text-red-400 hover:text-red-300"
                      >Sim</button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="cursor-pointer text-[10px] font-bold text-slate-400 hover:text-white"
                      >Não</button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="cursor-pointer text-slate-500 hover:text-red-400 active:scale-90"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className={`mt-3 flex justify-between rounded-xl px-3 py-2 text-xs font-semibold ${
            activeType === 'expense'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            <span>Total ativo</span>
            <span>{currency(activeTotal)}</span>
          </div>
        </>
      )}
    </Card>
  );
}
