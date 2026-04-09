import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface Props {
  month: string; // YYYY-MM
  onChange: (month: string) => void;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function parseMonth(m: string): [number, number] {
  const [y, mo] = m.split('-').map(Number);
  return [y, mo];
}

function formatMonth(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function MonthSelector({ month, onChange }: Props) {
  const [year, mo] = parseMonth(month);

  function prev() {
    const pm = mo === 1 ? 12 : mo - 1;
    const py = mo === 1 ? year - 1 : year;
    onChange(formatMonth(py, pm));
  }

  function next() {
    const nm = mo === 12 ? 1 : mo + 1;
    const ny = mo === 12 ? year + 1 : year;
    onChange(formatMonth(ny, nm));
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={prev}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-all cursor-pointer active:scale-95"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2.5 min-w-48 justify-center">
        <Calendar className="h-4.5 w-4.5 text-emerald-400" />
        <span className="text-base font-bold text-white tracking-tight">
          {monthNames[mo - 1]} {year}
        </span>
      </div>

      <button
        onClick={next}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-all cursor-pointer active:scale-95"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
