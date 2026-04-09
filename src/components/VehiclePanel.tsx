import { useState, type FormEvent } from 'react';
import { Car, Wrench, Settings, CheckCircle } from 'lucide-react';
import type { Vehicle, MaintenanceReserveConfig } from '../types';
import { Card, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { currency } from '../lib/utils';
import { calculateMaintenanceReserve } from '../lib/calculations';

interface Props {
  vehicle: Vehicle | null;
  config: MaintenanceReserveConfig;
  totalKm: number;
  totalEarnings: number;
  onSaveVehicle: (v: Vehicle) => void;
  onSaveConfig: (c: MaintenanceReserveConfig) => void;
}

const fuelOptions = [
  { value: 'flex', label: 'Flex' },
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'etanol', label: 'Etanol' },
  { value: 'gnv', label: 'GNV' },
];

export function VehiclePanel({ vehicle, config, totalKm, totalEarnings, onSaveVehicle, onSaveConfig }: Props) {
  const [model, setModel] = useState(vehicle?.model ?? '');
  const [year, setYear] = useState(String(vehicle?.year ?? new Date().getFullYear()));
  const [currentKm, setCurrentKm] = useState(String(vehicle?.currentKm ?? ''));
  const [fuelType, setFuelType] = useState<Vehicle['fuelType']>(vehicle?.fuelType ?? 'flex');
  const [vehicleSaved, setVehicleSaved] = useState(false);

  const [method, setMethod] = useState(config.method);
  const [valuePerKm, setValuePerKm] = useState(String(config.valuePerKm));
  const [revenuePercent, setRevenuePercent] = useState(String(config.revenuePercent));
  const [configSaved, setConfigSaved] = useState(false);

  function handleVehicle(e: FormEvent) {
    e.preventDefault();
    onSaveVehicle({
      model: model.trim(),
      year: Number(year),
      currentKm: Number(currentKm),
      fuelType,
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

  return (
    <div className="animate-page grid gap-4 sm:gap-6 lg:grid-cols-2">
      {/* Cadastro do veículo */}
      <Card>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-400" />
            Meu Veículo
          </span>
        </CardTitle>

        {vehicle && !vehicleSaved && (
          <div className="mb-4 flex items-center gap-3 rounded-xl sm:rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 sm:p-4">
            <Car className="h-5 w-5 text-blue-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{vehicle.model} ({vehicle.year})</p>
              <p className="text-xs text-slate-500">{vehicle.currentKm.toLocaleString('pt-BR')} km • {vehicle.fuelType}</p>
            </div>
          </div>
        )}

        {vehicleSaved && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 animate-page">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-emerald-300">Veículo salvo!</span>
          </div>
        )}

        <form onSubmit={handleVehicle} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input id="v-model" label="Modelo" placeholder="Ex: Onix 1.0" value={model} onChange={(e) => setModel(e.target.value)} />
          <Input id="v-year" label="Ano" type="number" min="2000" max="2030" value={year} onChange={(e) => setYear(e.target.value)} />
          <Input id="v-km" label="KM Atual" type="number" min="0" value={currentKm} onChange={(e) => setCurrentKm(e.target.value)} />
          <Select id="v-fuel" label="Combustível" options={fuelOptions} value={fuelType} onChange={(e) => setFuelType(e.target.value as Vehicle['fuelType'])} />
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
    </div>
  );
}
