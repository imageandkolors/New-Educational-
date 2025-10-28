'use client'

import { BookOpen, Assignment, Calendar, Trophy } from 'lucide-react'
import StatsCard from '@/components/ui/StatsCard'

interface StudentDashboardProps {
  user: any
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Enrolled Courses"
          value={6}
          icon={BookOpen}
          color="blue"
        />
        <StatsCard
          title="Pending Assignments"
          value={3}
          icon={Assignment}
          color="red"
        />
        <StatsCard
          title="Upcoming Classes"
          value={4}
          icon={Calendar}
          color="purple"
        />
        <StatsCard
          title="Average Grade"
          value="85%"
          icon={Trophy}
          color="emerald"
        />
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Student Dashboard</h3>
        </div>
        <div className="card-content">
          <p className="text-gray-500">Student-specific features coming soon...</p>
        </div>
      </div>
    </div>
  )
}