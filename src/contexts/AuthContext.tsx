import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail as fbUpdateEmail,
  updatePassword as fbUpdatePassword,
  updateProfile as fbUpdateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGoogleUser: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  changeEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changeDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isGoogleUser = user?.providerData.some((p) => p.providerId === 'google.com') ?? false;

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await fbUpdateProfile(user, { displayName });
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const reauthenticate = useCallback(async (currentPassword: string) => {
    if (!auth.currentUser || !auth.currentUser.email) throw new Error('Usuário não autenticado');
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
  }, []);

  const changeEmail = useCallback(async (newEmail: string, currentPassword: string) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    await reauthenticate(currentPassword);
    await fbUpdateEmail(auth.currentUser, newEmail);
  }, [reauthenticate]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    await reauthenticate(currentPassword);
    await fbUpdatePassword(auth.currentUser, newPassword);
  }, [reauthenticate]);

  const changeDisplayName = useCallback(async (name: string) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    await fbUpdateProfile(auth.currentUser, { displayName: name });
    // Força re-render — displayName é mutado in-place no User, precisa forçar
    forceRender((n) => n + 1);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isGoogleUser,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    changeEmail,
    changePassword,
    changeDisplayName,
  };

  return (
    <AuthContext value={value}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
