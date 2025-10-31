import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface User {
  id: string;
  email: string;
  titlePrefix?: string | null;
  firstName?: string;
  lastName?: string;
  fullName: string;
  role: string;
  profileImageUrl: string | null;
  departmentId: string | null;
  jobTitleId?: string | null;
  jobTitle?: string | null;
  jobLevel: string | null;
  workLocation?: string | null;
  internalPhone?: string | null;
  pinnedTasks: string[];
  additionalRoles: any;
  createdAt: string;
  department?: {
    id: string;
    name: string;
    tel: string | null;
    division: {
      id: string;
      name: string;
      missionGroup: {
        id: string;
        name: string;
      };
    };
  };
  permissions?: string[];
}

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterRequest {
  titlePrefix?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  departmentId?: string;
}

interface LoginResponse {
  // Security: VULN-003 Fix - sessionToken is now in httpOnly cookie, not in response body
  user: User;
  expiresAt: string;
}

interface RegisterResponse {
  user: User;
}

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current user from session
  // Security: VULN-003 Fix - No localStorage needed, session is in httpOnly cookie
  const { data: user, isLoading } = useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return null;
      }

      // Security: VULN-003 Fix - No localStorage check needed
      // The browser automatically sends the httpOnly session cookie
      // If cookie is valid, API returns user data; if not, returns 401

      try {
        const response = await api.get<User>('/api/users/me');
        // api.get already extracts .data field, so response is the user object
        return response ?? null;
      } catch (error) {
        // Session cookie invalid or expired
        // No cleanup needed - cookie is httpOnly and managed by server
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry failed auth requests
    placeholderData: null, // Provide placeholder data to prevent undefined
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post<LoginResponse>('/api/auth/login', data);
      return response;
    },
    onSuccess: (data) => {
      // CRITICAL: Clear all cached queries from previous user session AFTER successful login
      // This prevents data leakage between user sessions (notifications, tasks, etc.)
      queryClient.removeQueries();

      // Security: VULN-003 Fix - No localStorage needed
      // Session token is automatically stored in httpOnly cookie by the server
      // Browser will send it with every subsequent request

      // Update query cache with new user data
      queryClient.setQueryData(authKeys.user(), data.user);

      toast({
        title: 'เข้าสู่ระบบสำเร็จ',
        description: `ยินดีต้อนรับ ${data.user.fullName}`,
      });

      // Privacy: Extend consent on successful login (auto-refresh 15 day expiration)
      if (typeof window !== 'undefined') {
        try {
          const consentStr = localStorage.getItem('privacy_consent');
          if (consentStr) {
            const consent = JSON.parse(consentStr);
            if (consent.accepted) {
              const updatedConsent = {
                ...consent,
                timestamp: Date.now(),  // Extend by 15 days from now
              };
              localStorage.setItem('privacy_consent', JSON.stringify(updatedConsent));
            }
          }
        } catch (error) {
          logger.error('Failed to extend privacy consent', error as Error);
        }
      }

      // Conditional redirect based on role
      // USER role goes to IT Service, other roles go to dashboard
      // Use replace (not push) to avoid adding to history and faster redirect
      if (data.user.role === 'USER') {
        router.replace('/it-service');
      } else {
        router.replace('/dashboard');
      }
    },
    onError: (error: any) => {
      // Toast notification (will disappear)
      toast({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        description: error.response?.data?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        variant: 'destructive',
      });
      // Error is also available in mutation.error for persistent display
    },
    retry: false, // Don't retry failed login attempts
    // retryOnMount: false, // Don't retry when component remounts
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await api.post<RegisterResponse>('/api/auth/register', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'ลงทะเบียนสำเร็จ',
        description: 'กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี',
      });

      // Redirect to login
      router.push('/login');
    },
    onError: (error: any) => {
      toast({
        title: 'ลงทะเบียนไม่สำเร็จ',
        description: error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/logout', {});
    },
    onSettled: () => {
      // Security: VULN-003 Fix - No localStorage cleanup needed
      // Session cookie is cleared by the server (httpOnly cookie)

      // Clear query cache
      queryClient.setQueryData(authKeys.user(), null);
      queryClient.clear();

      toast({
        title: 'ออกจากระบบสำเร็จ',
      });

      // Redirect to login
      router.push('/login');
    },
  });

  // Request password reset
  const requestResetMutation = useMutation({
    mutationFn: async (email: string) => {
      await api.post('/api/auth/request-reset', { email });
    },
    onSuccess: () => {
      toast({
        title: 'ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว',
        description: 'กรุณาตรวจสอบอีเมลของคุณ',
      });
    },
    onError: () => {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    },
  });

  // Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      await api.post('/api/auth/reset-password', { token, password });
    },
    onSuccess: () => {
      toast({
        title: 'เปลี่ยนรหัสผ่านสำเร็จ',
        description: 'คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว',
      });

      router.push('/login');
    },
    onError: (error: any) => {
      toast({
        title: 'เปลี่ยนรหัสผ่านไม่สำเร็จ',
        description: error.response?.data?.message || 'ลิงก์หมดอายุหรือไม่ถูกต้อง',
        variant: 'destructive',
      });
    },
  });

  // Verify email
  const verifyEmailMutation = useMutation({
    mutationFn: async (token: string) => {
      await api.post('/api/auth/verify-email', { token });
    },
    onSuccess: () => {
      toast({
        title: 'ยืนยันอีเมลสำเร็จ',
        description: 'คุณสามารถเข้าสู่ระบบได้แล้ว',
      });

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: 'ยืนยันอีเมลไม่สำเร็จ',
        description: error.response?.data?.message || 'ลิงก์หมดอายุหรือไม่ถูกต้อง',
        variant: 'destructive',
      });
    },
  });

  // Resend verification email
  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      await api.post('/api/auth/send-verification', { email });
    },
    onSuccess: () => {
      toast({
        title: 'ส่งอีเมลยืนยันแล้ว',
        description: 'กรุณาตรวจสอบอีเมลของคุณ',
      });
    },
    onError: () => {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    requestReset: requestResetMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    verifyEmail: verifyEmailMutation.mutate,
    resendVerification: resendVerificationMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    loginMutation, // Return entire mutation for advanced control
    resetLoginError: loginMutation.reset, // Reset mutation state (clear error)
  };
}
