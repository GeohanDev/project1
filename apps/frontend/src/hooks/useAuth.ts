'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, setToken, clearToken } from '@/lib/api';
import { storeUser, clearUser, getStoredUser } from '@/lib/auth';
import { AuthUser } from '@reporthub/shared';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const qc = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('rh_token') : null;
      if (!token) return null;
      try {
        const data = await api.get<AuthUser>('/api/auth/me');
        storeUser(data);
        return data;
      } catch {
        clearToken();
        clearUser();
        return null;
      }
    },
    initialData: getStoredUser,
    staleTime: 5 * 60 * 1000,
  });

  const login = useMutation({
    mutationFn: (creds: { email: string; password: string }) =>
      api.post<{ token: string; user: AuthUser }>('/api/auth/login', creds),
    onSuccess: ({ token, user }) => {
      setToken(token);
      storeUser(user);
      qc.setQueryData(['auth', 'me'], user);
      router.push('/dashboard');
    },
  });

  const logout = () => {
    clearToken();
    clearUser();
    qc.clear();
    router.push('/login');
  };

  return { user, isLoading, login, logout };
}
