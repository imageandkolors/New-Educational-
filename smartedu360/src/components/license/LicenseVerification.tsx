'use client'

import { useState } from 'react'
import { Key, Shield, AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react'

interface LicenseVerificationProps {
  onVerified: () => void
}

export default function LicenseVerification({ onVerified }: LicenseVerificationProps) {
  const [licenseKey, setLicenseKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [licenseInfo, setLicenseInfo] = useState<any>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const deviceId = localStorage.getItem('deviceId')
      const offlineToken = localStorage.getItem('offlineToken')

      const response = await fetch('/api/license/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          licenseKey: licenseKey.trim().toUpperCase(),
          deviceId,
          offlineToken,
          forceOffline: isOfflineMode
        })
      })

      const data = await response.json()

      if (data.success && data.data.isValid) {
        // Store license information
        localStorage.setItem('licenseKey', licenseKey.trim().toUpperCase())
        if (data.data.license?.offlineToken) {
          localStorage.setItem('offlineToken', data.data.license.offlineToken)
        }
        
        setLicenseInfo(data.data)
        
        // Auto-proceed after showing success
        setTimeout(() => {
          onVerified()
        }, 2000)
      } else {
        setError(data.data?.error || 'License verification failed')
      }
    } catch (error) {
      setError('Network error. Please try again or use offline mode.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleOfflineMode = () => {
    setIsOfflineMode(!isOfflineMode)
    setError('')
  }

  if (licenseInfo) {
    return (
      <div className="card">
        <div className="card-header text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-600">License Verified!</h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
        
        <div className="card-content">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Days Remaining:</span>
              <span className="font-medium">{licenseInfo.remainingDays} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Features:</span>
              <span className="font-medium">{licenseInfo.features.length} enabled</span>
            </div>
            {licenseInfo.license?.isOffline && (
              <div className="flex justify-between">
                <span className="text-gray-600">Mode:</span>
                <span className="font-medium text-orange-600 flex items-center">
                  <WifiOff className="h-4 w-4 mr-1" />
                  Offline
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold">License Verification</h2>
          <p className="text-gray-600">Enter your license key to continue</p>
        </div>
      </div>
      
      <div className="card-content">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="licenseKey" className="text-sm font-medium text-gray-700">
              License Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                id="licenseKey"
                type="text"
                required
                className="input pl-10 font-mono text-sm"
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                maxLength={29} // Including dashes
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter the license key provided by your administrator
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={toggleOfflineMode}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
            >
              {isOfflineMode ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
              <span>{isOfflineMode ? 'Offline Mode' : 'Online Mode'}</span>
            </button>
            
            {isOfflineMode && (
              <div className="flex items-center space-x-1 text-xs text-orange-600">
                <Clock className="h-3 w-3" />
                <span>Limited time available</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !licenseKey.trim()}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying License...
              </div>
            ) : (
              `Verify License ${isOfflineMode ? '(Offline)' : ''}`
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Need Help?</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Contact your school administrator for license key</li>
            <li>• Use offline mode if internet connection is unavailable</li>
            <li>• License keys are case-insensitive</li>
          </ul>
        </div>
      </div>
    </div>
  )
}