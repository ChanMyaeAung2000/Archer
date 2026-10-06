import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { api, ApiError, tokenStore, type User, type UserRole } from '@/lib/api';

type AuthValue = { user: User | null; isLoading: boolean; signIn: (email: string, password: string) => Promise<void>; signUp: (input: { name: string; email: string; password: string; role: UserRole }) => Promise<void>; syncUser: () => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    void tokenStore.getAccess().then((token) => token ? api.me() : null).then((result) => { if (mounted && result) setUser(result.user); }).catch((error: unknown) => { if (!(error instanceof ApiError) || error.status !== 0) void tokenStore.clear(); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);
  const value = useMemo<AuthValue>(() => ({
    user, isLoading,
    async signIn(email, password) { const result = await api.login({ email, password }); await tokenStore.save(result.accessToken, result.refreshToken); setUser(result.user); },
    async signUp(input) { const result = await api.register(input); await tokenStore.save(result.accessToken, result.refreshToken); setUser(result.user); },
    async syncUser() { const result = await api.me(); setUser(result.user); },
    async signOut() { try { await api.logout(); } finally { await tokenStore.clear(); setUser(null); } }
  }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used within AuthProvider'); return value; }
