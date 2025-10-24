'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import LicenseValidator from '@/components/license/LicenseValidator';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [licenseValid, setLicenseValid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLicense();
  }, []);

  const checkAuthAndLicense = async () => {
    try {
      // Check if user is already authenticated
      const token = localStorage.getItem('auth-token') || 
                   document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];

      if (token) {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);
          router.push('/dashboard');
          return;
        }
      }

      // Check license status
      const licenseKey = localStorage.getItem('license-key');
      const deviceId = localStorage.getItem('device-id') || generateDeviceId();

      if (licenseKey) {
        const licenseResponse = await fetch('/api/licenses/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            licenseKey,
            deviceId,
            offline: !navigator.onLine,
          }),
        });

        if (licenseResponse.ok) {
          const { data } = await licenseResponse.json();
          setLicenseValid(data.isValid);
        }
      }
    } catch (error) {
      console.error('Auth/License check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDeviceId = () => {
    const deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('device-id', deviceId);
    return deviceId;
  };

  const handleLicenseValidated = () => {
    setLicenseValid(true);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SmartEdu360</h1>
            <p className="text-gray-600">Educational Management Platform</p>
          </div>

          {/* License Validation or Login Form */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            {!licenseValid ? (
              <LicenseValidator onValidated={handleLicenseValidated} />
            ) : (
              <LoginForm onSuccess={handleLoginSuccess} />
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>&copy; 2024 SmartEdu360. All rights reserved.</p>
            <p className="mt-1">
              Version 1.0.0 | 
              <span className={`ml-1 ${navigator.onLine ? 'text-green-600' : 'text-orange-600'}`}>
                {navigator.onLine ? 'Online' : 'Offline'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}