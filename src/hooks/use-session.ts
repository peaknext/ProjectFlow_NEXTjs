import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  departmentId?: string;
}

interface Session {
  userId: string;
  token: string;
  expiresAt: string;
  user?: User;
}

/**
 * useSession Hook
 *
 * Fetches and caches current user session data.
 * Used for authentication and permission checks.
 *
 * @returns React Query result with session data
 *
 * @example
 * const { data: session, isLoading } = useSession();
 * if (session) {
 * }
 */
export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const response = await api.get<{ user: User; session: Session }>('/api/auth/session');
        return response.session;
      } catch (error) {
        // If session fetch fails, user is not authenticated
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false // Don't retry auth errors
  });
}

/**
 * useCurrentUser Hook
 *
 * Returns only the user object from session.
 *
 * @returns React Query result with user data
 */
export function useCurrentUser() {
  const { data: session, ...rest } = useSession();

  return {
    data: session?.user,
    ...rest
  };
}

/**
 * isAuthenticated Utility
 *
 * Checks if user is currently authenticated.
 */
export function isAuthenticated(session: Session | null | undefined): boolean {
  if (!session) return false;

  const expiresAt = new Date(session.expiresAt);
  const now = new Date();

  return expiresAt > now;
}
