'use client'

import { BookOpen, Users, Assignment, Calendar } from 'lucide-react'
import StatsCard from '@/components/ui/StatsCard'

interface TeacherDashboardProps {
  user: any
}

export default function TeacherDashboard({ user }: TeacherDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="My Classes"
          value={5}
          icon={BookOpen}
          color="blue"
        />
        <StatsCard
          title="Total Students"
          value={125}
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Assignments"
          value={8}
          icon={Assignment}
          color="purple"
        />
        <StatsCard
          title="Today's Classes"
          value={3}
          icon={Calendar}
          color="emerald"
        />
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Teacher Dashboard</h3>
        </div>
        <div className="card-content">
          <p className="text-gray-500">Teacher-specific features coming soon...</p>
        </div>
      </div>
    </div>
  )
}