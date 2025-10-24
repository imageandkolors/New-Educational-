'use client'

import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react'
import StatsCard from '@/components/ui/StatsCard'

interface StoreManagerDashboardProps {
  user: any
}

export default function StoreManagerDashboard({ user }: StoreManagerDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Inventory"
          value={1250}
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="Pending Orders"
          value={18}
          icon={ShoppingCart}
          color="red"
        />
        <StatsCard
          title="Suppliers"
          value={12}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Stock Level"
          value="85%"
          icon={TrendingUp}
          color="emerald"
        />
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Store Manager Dashboard</h3>
        </div>
        <div className="card-content">
          <p className="text-gray-500">Inventory management features coming soon...</p>
        </div>
      </div>
    </div>
  )
}