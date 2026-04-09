import { useState, useMemo, type FormEvent } from 'react';
import { Car, Wrench, Settings, CheckCircle, Fuel } from 'lucide-react';
import type { Vehicle, MaintenanceReserveConfig, Expense } from '../types';
import { Card, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { currency } from '../lib/utils';
import { calculateMaintenanceReserve, getMonth } from '../lib/calculations';

interface Props {
  vehicle: Vehicle | null;
  config: MaintenanceReserveConfig;
  totalKm: number;
  totalEarnings: number;
  expenses: Expense[];
  month: string;
  onSaveVehicle: (v: Vehicle) => void;
  onSaveConfig: (c: MaintenanceReserveConfig) => void;
}

const fuelOptions = [
  { value: 'flex', label: 'Flex' },
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'etanol', label: 'Etanol' },
  { value: 'gnv', label: 'GNV' },
];

export function VehiclePanel({ vehicle, config, totalKm, totalEarnings, expenses, month, onSaveVehicle, onSaveConfig }: Props) {
  const [model, setModel] = useState(vehicle?.model ?? '');
  const [year, setYear] = useState(String(vehicle?.year ?? new Date().getFullYear()));
  const [currentKm, setCurrentKm] = useState(String(vehicle?.currentKm ?? ''));
  const [fuelType, setFuelType] = useState<Vehicle['fuelType']>(vehicle?.fuelType ?? 'flex');
  const [avgKmPerLiter, setAvgKmPerLiter] = useState(String(vehicle?.avgKmPerLiter ?? ''));
  const [vehicleSaved, setVehicleSaved] = useState(false);

  const [method, setMethod] = useState(config.method);
  const [valuePerKm, setValuePerKm] = useState(String(config.valuePerKm));
  const [revenuePercent, setRevenuePercent] = useState(String(config.revenuePercent));
  const [configSaved, setConfigSaved] = useState(false);

  // Dados reais de combustível do mês
  const fuelData = useMemo(() => {
    return expenses
      .filter((e) => getMonth(e.date) === month && e.category === 'combustivel')
      .reduce(
        (acc, e) => ({
          total: acc.total + e.amount,
          liters: acc.liters + (e.liters ?? 0),
          count: acc.count + 1,
          sumPrice: acc.sumPrice + (e.pricePerLiter ?? 0),
          priceCount: acc.priceCount + (e.pricePerLiter ? 1 : 0),
        }),
        { total: 0, liters: 0, count: 0, sumPrice: 0, priceCount: 0 },
      );
  }, [expenses, month]);

  function handleVehicle(e: FormEvent) {
    e.preventDefault();
    onSaveVehicle({
      model: model.trim(),
      year: Number(year),
      currentKm: Number(currentKm),
      fuelType,
      avgKmPerLiter: Number(avgKmPerLiter) || undefined,
    });
    setVehicleSaved(true);
    setTimeout(() => setVehicleSaved(false), 2000);
  }

  function handleConfig(e: FormEvent) {
    e.preventDefault();
    onSaveConfig({
      method,
      valuePerKm: Number(valuePerKm),
      revenuePercent: Number(revenuePercent),
    });
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  }

  const reserveEstimate = calculateMaintenanceReserve(
    { method, valuePerKm: Number(valuePerKm), revenuePercent: Number(revenuePercent) },
    totalKm,
    totalEarnings,
  );

  const avgFuelPrice = fuelData.priceCount > 0 ? fuelData.sumPrice / fuelData.priceCount : 0;
  const costPerKm = totalKm > 0 ? fuelData.total / totalKm : 0;

  return (
    <div className="animate-page grid gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-2">
      {/* Cadastro do veículo */}
      <Card>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-400" />
            Meu Veículo
          </span>
        </CardTitle>

        {vehicle && !vehicleSaved && (
          <div className="mb-5 flex items-center gap-3 rounded-xl sm:rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5">
            <Car className="h-5 w-5 text-blue-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{vehicle.model} ({vehicle.year})</p>
              <p className="text-xs text-slate-500">{vehicle.currentKm.toLocaleString('pt-BR')} km • {vehicle.fuelType}{vehicle.avgKmPerLiter ? ` • ${vehicle.avgKmPerLiter} km/l` : ''}</p>
            </div>
          </div>
        )}

        {vehicleSaved && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 animate-page">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-emerald-300">Veículo salvo!</span>
          </div>
        )}

        <form onSubmit={handleVehicle} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input id="v-model" label="Modelo" placeholder="Ex: Onix 1.0" value={model} onChange={(e) => setModel(e.target.value)} />
          <Input id="v-year" label="Ano" type="number" min="2000" max="2030" value={year} onChange={(e) => setYear(e.target.value)} />
          <Input id="v-km" label="KM Atual" type="number" min="0" value={currentKm} onChange={(e) => setCurrentKm(e.target.value)} />
          <Select id="v-fuel" label="Combustível" options={fuelOptions} value={fuelType} onChange={(e) => setFuelType(e.target.value as Vehicle['fuelType'])} />
          <Input id="v-kmpl" label="Consumo (km/l)" type="number" min="0" step="0.1" placeholder="Ex: 12.5" value={avgKmPerLiter} onChange={(e) => setAvgKmPerLiter(e.target.value)} className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full">
              <Car className="h-4 w-4" /> Salvar Veículo
            </Button>
          </div>
        </form>
      </Card>

      {/* Configuração da Reserva de Manutenção */}
      <Card>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-amber-400" />
            Reserva de Manutenção
          </span>
        </CardTitle>

        <div className="mb-4 sm:mb-5 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 sm:p-4 text-sm text-amber-200/80">
          <p className="flex items-center gap-1.5 font-medium text-amber-300 mb-1">
            <Settings className="h-4 w-4" /> Como funciona?
          </p>
          <p>
            Reserva preventiva (óleo, pneus, revisões) e corretiva (freios, suspensão). Sugerimos R$ 0,08–0,15/km ou 5–10% do bruto.
          </p>
        </div>

        {configSaved && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 animate-page">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-emerald-300">Configuração salva!</span>
          </div>
        )}

        <form onSubmit={handleConfig} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            id="m-method"
            label="Método"
            options={[
              { value: 'per_km', label: 'Por KM Rodado' },
              { value: 'per_revenue', label: '% do Faturamento' },
            ]}
            value={method}
            onChange={(e) => setMethod(e.target.value as MaintenanceReserveConfig['method'])}
          />
          {method === 'per_km' ? (
            <Input id="m-perkm" label="R$ por KM" type="number" min="0" step="0.01" value={valuePerKm} onChange={(e) => setValuePerKm(e.target.value)} />
          ) : (
            <Input id="m-percent" label="% do Bruto" type="number" min="0" max="100" step="0.5" value={revenuePercent} onChange={(e) => setRevenuePercent(e.target.value)} />
          )}
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" className="w-full">
              <Wrench className="h-4 w-4" /> Salvar Configuração
            </Button>
          </div>
        </form>

        <div className="mt-4 sm:mt-5 rounded-xl sm:rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 sm:p-5 text-center">
          <p className="text-xs sm:text-sm text-slate-400 font-medium">Reserva estimada este mês</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight">{currency(reserveEstimate)}</p>
          {totalKm > 0 && (
            <p className="mt-1 text-xs text-slate-600">{totalKm.toLocaleString('pt-BR')} km rodados</p>
          )}
        </div>
      </Card>

      {/* Custo de Combustível */}
      <Card className="lg:col-span-2">
        <CardTitle>
          <span className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-orange-400" />
            Custo de Combustível
          </span>
        </CardTitle>
        {fuelData.total > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
                <p className="text-xs text-red-300/70">Gasto Total</p>
                <p className="text-xl font-bold text-red-300">{currency(fuelData.total)}</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-center">
                <p className="text-xs text-blue-300/70">KM Rodados</p>
                <p className="text-xl font-bold text-blue-300">{totalKm.toLocaleString('pt-BR')} km</p>
              </div>
              {fuelData.liters > 0 && (
                <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 text-center">
                  <p className="text-xs text-orange-300/70">Litros Abastecidos</p>
                  <p className="text-xl font-bold text-orange-300">{fuelData.liters.toFixed(1)} L</p>
                </div>
              )}
              {costPerKm > 0 && (
                <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 text-center">
                  <p className="text-xs text-purple-300/70">Custo por KM</p>
                  <p className="text-xl font-bold text-purple-300">{currency(costPerKm)}</p>
                </div>
              )}
            </div>
            {avgFuelPrice > 0 && (
              <p className="mt-3 text-xs text-slate-500 text-center">Preço médio do litro: R$ {avgFuelPrice.toFixed(2)} · {fuelData.count} abastecimento{fuelData.count !== 1 ? 's' : ''}</p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <Fuel className="mb-2 h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500">Nenhum gasto com combustível registrado neste mês</p>
            <p className="mt-1 text-xs text-slate-600">Adicione gastos na categoria "Combustível" na aba Finanças</p>
          </div>
        )}
      </Card>
    </div>
  );
}
