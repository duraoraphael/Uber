import { useState } from 'react';
import { Eye, EyeOff, Car, TrendingUp, Shield, Sparkles } from 'lucide-react';
import driveFinanceLogo from '../assets/Logo driveFinance.webp';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const errorMessages: Record<string, string> = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-disabled': 'Conta desativada.',
  'auth/user-not-found': 'Usuário não encontrado.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/email-already-in-use': 'E-mail já cadastrado.',
  'auth/weak-password': 'Senha muito fraca (mín. 6 caracteres).',
  'auth/invalid-credential': 'Credenciais inválidas. Verifique seu e-mail e senha.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
};

function getFriendlyError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code;
    return errorMessages[code] || 'Erro na autenticação. Tente novamente.';
  }
  return 'Erro inesperado. Tente novamente.';
}

const features = [
  { icon: TrendingUp, text: 'Acompanhe seus ganhos diários e mensais' },
  { icon: Car,        text: 'Controle de veículo e custos de combustível' },
  { icon: Sparkles,   text: 'Insights com inteligência artificial' },
  { icon: Shield,     text: 'Dados seguros com backup automático' },
];

export function LoginScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function switchMode() {
    setIsSignUp((v) => !v);
    setError('');
    setFirstName('');
    setLastName('');
    setPassword('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        await signUp(email, password, fullName || undefined);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Left panel – branding (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-10 xl:p-14 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 left-1/4 h-56 w-56 rounded-full bg-white/5" />

        <div className="relative z-10">
          <img src={driveFinanceLogo} alt="driveFinance" className="h-16 object-contain" />
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
              Controle financeiro<br />para motoristas
            </h1>
            <p className="mt-3 text-emerald-100 text-base xl:text-lg leading-relaxed">
              Tudo que você precisa para acompanhar seus ganhos, gastos e crescer como motorista.
            </p>
          </div>

          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm xl:text-base text-emerald-50">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-emerald-200/70">
          © 2024 driveFinance. Todos os direitos reservados.
        </p>
      </div>

      {/* ── Right panel – form ── */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
        {/* Logo on mobile */}
        <div className="mb-8 lg:hidden">
          <img src={driveFinanceLogo} alt="driveFinance" className="mx-auto h-16 object-contain" />
        </div>

        <div className="w-full max-w-sm sm:max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {isSignUp ? 'Criar conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {isSignUp
                ? 'Preencha os dados para começar a usar gratuitamente'
                : 'Entre com sua conta para continuar'}
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all disabled:opacity-50 cursor-pointer
              bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm
              dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <GoogleIcon />
            {isSignUp ? 'Cadastrar com Google' : 'Entrar com Google'}
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
            <span className="text-xs font-medium text-gray-400 dark:text-slate-500">ou continue com e-mail</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="login-firstname"
                  label="Nome"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  placeholder="João"
                />
                <Input
                  id="login-lastname"
                  label="Sobrenome"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  placeholder="Silva"
                />
              </div>
            )}

            <Input
              id="login-email"
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="joao@email.com"
            />

            {/* Password with show/hide */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="login-password"
                className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder={isSignUp ? 'Mínimo 6 caracteres' : '••••••••'}
                  className="w-full rounded-xl border px-3 py-3 pr-11 text-sm outline-none transition-all min-h-[44px] sm:min-h-[40px]
                    bg-gray-50 border-gray-300/80 text-slate-900 placeholder:text-gray-400
                    dark:bg-slate-950 dark:border-slate-700/80 dark:text-slate-100 dark:placeholder:text-slate-600
                    focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 dark:border-red-500/20 dark:bg-red-500/10">
                <span className="mt-0.5 text-red-500 dark:text-red-400 shrink-0">⚠</span>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading} size="lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Aguarde...
                </span>
              ) : isSignUp ? 'Criar Conta Grátis' : 'Entrar'}
            </Button>
          </form>

          {/* Switch mode */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}
            <button
              onClick={switchMode}
              className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer transition-colors"
            >
              {isSignUp ? 'Fazer login' : 'Criar conta grátis'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
