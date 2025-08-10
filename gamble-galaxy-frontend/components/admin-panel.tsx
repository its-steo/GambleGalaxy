"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, Activity, AlertTriangle } from "lucide-react"

export default function AdminPanel() {
  const stats = {
    totalUsers: 12847,
    totalRevenue: 125000,
    activeBets: 1247,
    pendingWithdrawals: 23,
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Platform management and monitoring</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeBets.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Active Bets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingWithdrawals}</p>
                <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <span>New user registration: john@example.com</span>
              <Badge>2 min ago</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Large bet placed: $500 on Manchester United</span>
              <Badge variant="secondary">5 min ago</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Withdrawal request: $200</span>
              <Badge variant="destructive">10 min ago</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
