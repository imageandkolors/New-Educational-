'use client'

import { DollarSign, CreditCard, FileText, TrendingUp } from 'lucide-react'
import StatsCard from '@/components/ui/StatsCard'

interface BursarDashboardProps {
  user: any
}

export default function BursarDashboard({ user }: BursarDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Monthly Revenue"
          value="$45,230"
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Pending Payments"
          value={23}
          icon={CreditCard}
          color="red"
        />
        <StatsCard
          title="Invoices Sent"
          value={156}
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="Collection Rate"
          value="92%"
          icon={TrendingUp}
          color="emerald"
        />
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Bursar Dashboard</h3>
        </div>
        <div className="card-content">
          <p className="text-gray-500">Financial management features coming soon...</p>
        </div>
      </div>
    </div>
  )
}