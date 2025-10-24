'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import LicenseVerification from '@/components/license/LicenseVerification'

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLicenseValid, setIsLicenseValid] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLicense()
  }, [])

  const checkAuthAndLicense = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (token) {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          setIsAuthenticated(true)
          
          // Check license
          const licenseKey = localStorage.getItem('licenseKey')
          if (licenseKey) {
            const licenseResponse = await fetch('/api/license/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                licenseKey,
                deviceId: localStorage.getItem('deviceId'),
                offlineToken: localStorage.getItem('offlineToken')
              })
            })
            
            if (licenseResponse.ok) {
              const licenseData = await licenseResponse.json()
              if (licenseData.success) {
                setIsLicenseValid(true)
                router.push('/dashboard')
                return
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Auth/License check error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLicenseVerified = () => {
    setIsLicenseValid(true)
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">SmartEdu360</h1>
            <p className="text-gray-600">Educational Platform with License Management</p>
          </div>

          {!isAuthenticated ? (
            <LoginForm onSuccess={handleLoginSuccess} />
          ) : !isLicenseValid ? (
            <LicenseVerification onVerified={handleLicenseVerified} />
          ) : null}
        </div>
      </div>
    </div>
  )
}