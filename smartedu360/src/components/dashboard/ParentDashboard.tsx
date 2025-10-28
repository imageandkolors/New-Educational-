'use client'

import { Users, TrendingUp, MessageCircle, Calendar } from 'lucide-react'
import StatsCard from '@/components/ui/StatsCard'

interface ParentDashboardProps {
  user: any
}

export default function ParentDashboard({ user }: ParentDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Children"
          value={2}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Average Performance"
          value="88%"
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="New Messages"
          value={3}
          icon={MessageCircle}
          color="purple"
        />
        <StatsCard
          title="Upcoming Events"
          value={5}
          icon={Calendar}
          color="emerald"
        />
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Parent Dashboard</h3>
        </div>
        <div className="card-content">
          <p className="text-gray-500">Parent-specific features coming soon...</p>
        </div>
      </div>
    </div>
  )
}