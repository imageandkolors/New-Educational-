'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Wifi, WifiOff } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  // Monitor online status
  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const deviceId = localStorage.getItem('device-id') || 
                      'device_' + Math.random().toString(36).substr(2, 9);
      
      if (!localStorage.getItem('device-id')) {
        localStorage.setItem('device-id', deviceId);
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          deviceId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Store auth token
      localStorage.setItem('auth-token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));

      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Online Status Indicator */}
      <div className={cn(
        'flex items-center justify-center p-2 rounded-md text-sm',
        isOnline 
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-orange-50 text-orange-700 border border-orange-200'
      )}>
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 mr-2" />
            Connected
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 mr-2" />
            Offline Mode
          </>
        )}
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-600">Sign in to your account</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className={cn(
              'form-input',
              errors.email && 'border-red-300 focus:border-red-500 focus:ring-red-500'
            )}
            placeholder="Enter your email"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              className={cn(
                'form-input pr-10',
                errors.password && 'border-red-300 focus:border-red-500 focus:ring-red-500'
              )}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              {...register('rememberMe')}
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <a
              href="#"
              className="font-medium text-primary-600 hover:text-primary-500"
              onClick={(e) => e.preventDefault()}
            >
              Forgot password?
            </a>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
            'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          )}
        >
          {isLoading ? (
            <LoadingSpinner size="small" color="white" />
          ) : (
            <>
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </>
          )}
        </button>
      </form>

      {/* Demo Accounts */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Demo Accounts</h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div>Admin: admin@demo.com / password123</div>
          <div>Teacher: teacher@demo.com / password123</div>
          <div>Student: student@demo.com / password123</div>
          <div>Parent: parent@demo.com / password123</div>
        </div>
      </div>
    </div>
  );
}