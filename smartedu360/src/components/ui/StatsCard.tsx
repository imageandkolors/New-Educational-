'use client'

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'emerald'
}

export default function StatsCard({ title, value, icon: Icon, trend, color = 'blue' }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50',
    red: 'bg-red-500 text-red-600 bg-red-50',
    yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
    emerald: 'bg-emerald-500 text-emerald-600 bg-emerald-50'
  }

  const [bgColor, textColor, iconBg] = colorClasses[color].split(' ')

  return (
    <div className="card">
      <div className="card-content">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 ${iconBg} rounded-md flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${textColor}`} />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trend.isPositive ? (
                      <TrendingUp className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                    )}
                    <span className="ml-1">{Math.abs(trend.value)}%</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}