import { useState } from 'react';
import { Fuel, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { currency } from '../lib/utils';

interface Props {
  theme: 'dark' | 'light';
}

export function FuelCalculator({ theme }: Props) {
  const [gasolinaPrice, setGasolinaPrice] = useState('');
  const [etanolPrice, setEtanolPrice] = useState('');

  const gasVal = parseFloat(gasolinaPrice) || 0;
  const etaVal = parseFloat(etanolPrice) || 0;

  const ratio = gasVal > 0 ? etaVal / gasVal : 0;
  const hasValues = gasVal > 0 && etaVal > 0;
  const etanolWins = ratio < 0.7;
  const recommendation = hasValues
    ? etanolWins
      ? 'Abasteça com Etanol!'
      : 'Abasteça com Gasolina!'
    : null;

  const savingsPerLiter = hasValues
    ? etanolWins
      ? (gasVal * 0.7 - etaVal)
      : (etaVal / 0.7 - gasVal)
    : 0;

  const isDark = theme === 'dark';

  return (
    <Card>
      <CardTitle>
        <span className="flex items-center gap-2">
          <Fuel className="h-5 w-5 text-amber-400" />
          Calculadora Etanol vs Gasolina
        </span>
      </CardTitle>

      <p className={`text-xs mb-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        Regra dos 70%: se Etanol &lt; 70% do preço da Gasolina, compensa abastecer com etanol.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Input
          id="gasolina-price"
          label="Gasolina (R$/L)"
          type="number"
          min="0"
          step="0.01"
          placeholder="6.49"
          value={gasolinaPrice}
          onChange={(e) => setGasolinaPrice(e.target.value)}
        />
        <Input
          id="etanol-price"
          label="Etanol (R$/L)"
          type="number"
          min="0"
          step="0.01"
          placeholder="4.29"
          value={etanolPrice}
          onChange={(e) => setEtanolPrice(e.target.value)}
        />
      </div>

      {hasValues && (
        <div className="space-y-3 animate-item">
          {/* Ratio bar */}
          <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Etanol / Gasolina
              </span>
              <span className={`text-lg font-bold ${etanolWins ? 'text-emerald-400' : 'text-amber-400'}`}>
                {(ratio * 100).toFixed(1)}%
              </span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  etanolWins ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(ratio * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>0%</span>
              <span className={`text-[10px] font-bold ${isDark ? 'text-red-400/60' : 'text-red-500/60'}`}>70%</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>100%</span>
            </div>
          </div>

          {/* Result */}
          <div className={`flex items-center gap-3 rounded-xl p-4 border ${
            etanolWins
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <CheckCircle className={`h-6 w-6 shrink-0 ${etanolWins ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {recommendation}
              </p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Economia de ~{currency(Math.abs(savingsPerLiter))}/L equivalente
              </p>
            </div>
            <ArrowRight className={`h-5 w-5 ml-auto ${etanolWins ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
        </div>
      )}
    </Card>
  );
}
