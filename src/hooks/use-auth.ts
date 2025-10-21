import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  department?: {
    id: string;
    name: string;
  };
}

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

interface LoginResponse {
  sessionToken: string;
  user: User;
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
  const { data: user, isLoading } = useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return null;
      }

      const token = localStorage.getItem('sessionToken');
      if (!token) {
        return null;
      }

      try {
        const response = await api.get<{ user: User }>('/api/users/me');
        // Ensure we always return a value (null if undefined)
        return response?.user ?? null;
      } catch (error) {
        // Token invalid or expired
        localStorage.removeItem('sessionToken');
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
      // Store session token
      localStorage.setItem('sessionToken', data.sessionToken);

      // Update query cache
      queryClient.setQueryData(authKeys.user(), data.user);

      toast({
        title: 'เข้าสู่ระบบสำเร็จ',
        description: `ยินดีต้อนรับ ${data.user.fullName}`,
      });

      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        description: error.response?.data?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        variant: 'destructive',
      });
    },
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
      // Clear session token
      localStorage.removeItem('sessionToken');

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
  };
}
