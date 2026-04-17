import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { LogOut, Shield, Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react';

interface ProfilePageProps {
  theme: 'dark' | 'light';
  onBack: () => void;
}

export function ProfilePage({ theme, onBack }: ProfilePageProps) {
  const { user, isGoogleUser, logout, changeEmail, changePassword, changeDisplayName } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');

  // Sync input when Firebase User.displayName is updated externally
  useEffect(() => {
    setDisplayName(user?.displayName ?? '');
  }, [user?.displayName]);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameMsg, setNameMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [emailMsg, setEmailMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [passMsg, setPassMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [nameLoading, setNameLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const isDark = theme === 'dark';

  const errorMessages: Record<string, string> = {
    'auth/requires-recent-login': 'Sessão expirada. Faça login novamente.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/email-already-in-use': 'Este e-mail já está em uso.',
    'auth/weak-password': 'Senha muito fraca (mín. 6 caracteres).',
    'auth/wrong-password': 'Senha atual incorreta.',
    'auth/invalid-credential': 'Senha atual incorreta.',
    'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
  };

  function getFriendlyError(err: unknown): string {
    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code: string }).code;
      return errorMessages[code] || 'Erro inesperado. Tente novamente.';
    }
    return err instanceof Error ? err.message : 'Erro inesperado.';
  }

  async function handleChangeName() {
    if (!displayName.trim()) return;
    setNameLoading(true);
    setNameMsg(null);
    try {
      await changeDisplayName(displayName.trim());
      setNameMsg({ text: 'Nome atualizado!', type: 'success' });
    } catch (err) {
      setNameMsg({ text: getFriendlyError(err), type: 'error' });
    } finally {
      setNameLoading(false);
    }
  }

  async function handleChangeEmail() {
    if (!newEmail.trim() || !emailPassword) return;
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      await changeEmail(newEmail.trim(), emailPassword);
      setEmailMsg({ text: 'E-mail atualizado!', type: 'success' });
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      setEmailMsg({ text: getFriendlyError(err), type: 'error' });
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setPassMsg({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ text: 'Nova senha deve ter no mínimo 6 caracteres.', type: 'error' });
      return;
    }
    setPassLoading(true);
    setPassMsg(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPassMsg({ text: 'Senha atualizada!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassMsg({ text: getFriendlyError(err), type: 'error' });
    } finally {
      setPassLoading(false);
    }
  }

  const photoURL = user?.photoURL;
  const initial = (user?.displayName || user?.email || '?')[0].toUpperCase();

  return (
    <div className="animate-page space-y-4 sm:space-y-5">
      {/* Botão voltar */}
      <button
        onClick={onBack}
        className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
          isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      {/* Info do usuário */}
      <Card>
        <div className="flex items-center gap-4">
          {photoURL ? (
            <img
              src={photoURL}
              alt="Avatar"
              className="h-16 w-16 rounded-full border-2 border-emerald-500/50 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user?.displayName || 'Usuário'}
            </h2>
            <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {user?.email}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-500 font-medium">
                {isGoogleUser ? 'Conta Google' : 'E-mail e senha'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Alterar nome */}
      <Card>
        <CardTitle>
          <span className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-emerald-400" /> Nome de Exibição
          </span>
        </CardTitle>
        <div className="space-y-3">
          <Input
            id="profile-name"
            label="Nome"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Seu nome"
          />
          {nameMsg && (
            <p className={`rounded-lg p-3 text-sm ${nameMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {nameMsg.text}
            </p>
          )}
          <Button onClick={handleChangeName} className="w-full" disabled={nameLoading}>
            {nameLoading ? 'Salvando...' : 'Salvar Nome'}
          </Button>
        </div>
      </Card>

      {/* Alterar e-mail (só para contas email/senha) */}
      {!isGoogleUser && (
        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-400" /> Alterar E-mail
            </span>
          </CardTitle>
          <div className="space-y-3">
            <Input
              id="profile-new-email"
              label="Novo e-mail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="novo@email.com"
              autoComplete="email"
            />
            <Input
              id="profile-email-password"
              label="Senha atual (confirmação)"
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              autoComplete="current-password"
            />
            {emailMsg && (
              <p className={`rounded-lg p-3 text-sm ${emailMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {emailMsg.text}
              </p>
            )}
            <Button onClick={handleChangeEmail} className="w-full" disabled={emailLoading}>
              {emailLoading ? 'Atualizando...' : 'Atualizar E-mail'}
            </Button>
          </div>
        </Card>
      )}

      {/* Alterar senha (só para contas email/senha) */}
      {!isGoogleUser && (
        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-400" /> Alterar Senha
            </span>
          </CardTitle>
          <div className="space-y-3">
            <Input
              id="profile-current-password"
              label="Senha atual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Input
              id="profile-new-password"
              label="Nova senha"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              id="profile-confirm-password"
              label="Confirmar nova senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {passMsg && (
              <p className={`rounded-lg p-3 text-sm ${passMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {passMsg.text}
              </p>
            )}
            <Button onClick={handleChangePassword} className="w-full" disabled={passLoading}>
              {passLoading ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </div>
        </Card>
      )}

      {/* Info para conta Google */}
      {isGoogleUser && (
        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" /> Conta Google
            </span>
          </CardTitle>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Sua conta é gerenciada pelo Google. Para alterar e-mail ou senha, acesse as configurações da sua conta Google.
          </p>
        </Card>
      )}

      {/* Logout */}
      <Card>
        <Button
          onClick={logout}
          variant="secondary"
          className={`w-full ${isDark ? 'hover:!bg-red-500/20 hover:!text-red-400' : 'hover:!bg-red-50 hover:!text-red-600'}`}
        >
          <LogOut className="h-4 w-4" /> Sair da Conta
        </Button>
      </Card>
    </div>
  );
}
