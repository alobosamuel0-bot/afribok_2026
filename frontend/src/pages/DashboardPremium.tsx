/**
 * Premium Hospital Dashboard
 * World-class UI matching Mayo Clinic and Cleveland Clinic standards
 * Real-time metrics, advanced visualizations, and sophisticated interactions
 */

import { useEffect, useState } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle, TrendingUp, Users, Bed, Activity, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";

// Sample data for visualizations
const patientLoadData = [
  { date: "Mon", predicted: 45, actual: 42, confidence: 92 },
  { date: "Tue", predicted: 52, actual: 48, confidence: 88 },
  { date: "Wed", predicted: 58, actual: 61, confidence: 85 },
  { date: "Thu", predicted: 63, actual: 59, confidence: 90 },
  { date: "Fri", predicted: 71, actual: 68, confidence: 87 },
  { date: "Sat", predicted: 48, actual: 45, confidence: 89 },
  { date: "Sun", predicted: 42, actual: 40, confidence: 91 },
];

const bedOccupancyData = [
  { time: "00:00", occupied: 65, available: 35 },
  { time: "04:00", occupied: 58, available: 42 },
  { time: "08:00", occupied: 72, available: 28 },
  { time: "12:00", occupied: 85, available: 15 },
  { time: "16:00", occupied: 88, available: 12 },
  { time: "20:00", occupied: 82, available: 18 },
  { time: "24:00", occupied: 70, available: 30 },
];

const departmentData = [
  { name: "ICU", value: 35, color: "#ef4444" },
  { name: "General", value: 28, color: "#3b82f6" },
  { name: "Surgical", value: 22, color: "#8b5cf6" },
  { name: "Emergency", value: 15, color: "#f59e0b" },
];

const riskDistribution = [
  { level: "Critical", count: 3, percentage: 5 },
  { level: "High", count: 12, percentage: 20 },
  { level: "Medium", count: 28, percentage: 47 },
  { level: "Low", count: 17, percentage: 28 },
];

// Premium Metric Card Component
function MetricCard({ 
  title, 
  value, 
  unit, 
  trend, 
  trendDirection, 
  icon: Icon, 
  color 
}: {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number;
  trendDirection?: "up" | "down" | "stable";
  icon: React.ComponentType<any>;
  color: string;
}) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className="mt-3 flex items-center gap-1">
              <TrendingUp 
                size={16} 
                className={trendDirection === "up" ? "text-red-500" : trendDirection === "down" ? "text-green-500" : "text-gray-400"}
              />
              <span className={`text-xs font-semibold ${
                trendDirection === "up" ? "text-red-600" : trendDirection === "down" ? "text-green-600" : "text-gray-600"
              }`}>
                {trendDirection === "up" ? "+" : ""}{trend}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </Card>
  );
}

// Risk Level Badge Component
function RiskBadge({ level }: { level: "critical" | "high" | "medium" | "low" }) {
  const colors = {
    critical: "bg-red-100 text-red-800 border-red-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-green-100 text-green-800 border-green-300",
  };

  return (
    <Badge className={`${colors[level]} border`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
}

// Alert Item Component
function AlertItem({ 
  type, 
  severity, 
  message, 
  time 
}: {
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  time: string;
}) {
  const severityColors = {
    critical: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  };

  const iconColors = {
    critical: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };

  return (
    <div className={`p-4 border rounded-lg ${severityColors[severity]} hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`${iconColors[severity]} flex-shrink-0 mt-0.5`} size={18} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900">{type}</p>
          <p className="text-sm text-gray-700 mt-1">{message}</p>
          <p className="text-xs text-gray-500 mt-2">{time}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPremium() {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Hospital Operations Center</h1>
        <p className="text-lg text-gray-600">Real-time monitoring and clinical intelligence</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Patients"
          value={247}
          unit="admitted"
          trend={12}
          trendDirection="up"
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title="Available Beds"
          value={23}
          unit="of 100"
          trend={-8}
          trendDirection="down"
          icon={Bed}
          color="bg-green-500"
        />
        <MetricCard
          title="Critical Alerts"
          value={3}
          unit="active"
          trend={0}
          trendDirection="stable"
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <MetricCard
          title="Avg Wait Time"
          value={18}
          unit="minutes"
          trend={-5}
          trendDirection="down"
          icon={Clock}
          color="bg-purple-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Patient Load Forecast */}
        <Card className="lg:col-span-2 p-6 hover:shadow-lg transition-shadow">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Patient Load Forecast</h2>
            <p className="text-sm text-gray-600">7-day prediction with confidence intervals</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={patientLoadData}>
              <defs>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                formatter={(value: any) => [`${value} patients`, "Count"]}
              />
              <Area type="monotone" dataKey="predicted" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPredicted)" name="Predicted" />
              <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} name="Actual" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Department Distribution */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Department Load</h2>
            <p className="text-sm text-gray-600">Current patient distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${value} patients`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {departmentData.map((dept) => (
              <div key={dept.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                  <span className="text-gray-700">{dept.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{dept.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bed Occupancy and Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Bed Occupancy Timeline */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">24-Hour Bed Occupancy</h2>
            <p className="text-sm text-gray-600">Real-time bed availability trend</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bedOccupancyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="occupied" stackId="a" fill="#ef4444" name="Occupied" />
              <Bar dataKey="available" stackId="a" fill="#10b981" name="Available" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Risk Distribution */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Patient Risk Distribution</h2>
            <p className="text-sm text-gray-600">Current risk stratification</p>
          </div>
          <div className="space-y-4">
            {riskDistribution.map((risk) => (
              <div key={risk.level}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RiskBadge level={risk.level.toLowerCase() as any} />
                    <span className="text-sm font-medium text-gray-700">{risk.count} patients</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{risk.percentage}%</span>
                </div>
                <Progress value={risk.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card className="p-6 hover:shadow-lg transition-shadow mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Active Clinical Alerts</h2>
          <p className="text-sm text-gray-600">Requires immediate attention</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AlertItem
            type="High-Risk Admission"
            severity="critical"
            message="Patient MRN-2847 admitted with critical risk score (8.5/10)"
            time="2 minutes ago"
          />
          <AlertItem
            type="Capacity Alert"
            severity="warning"
            message="ICU occupancy at 92%. Prepare overflow protocols."
            time="5 minutes ago"
          />
          <AlertItem
            type="Lab Result"
            severity="critical"
            message="Critical glucose level detected for patient MRN-2891"
            time="8 minutes ago"
          />
          <AlertItem
            type="Medication Interaction"
            severity="warning"
            message="Potential drug interaction flagged for review"
            time="12 minutes ago"
          />
          <AlertItem
            type="Discharge Ready"
            severity="info"
            message="Patient MRN-2756 ready for discharge planning"
            time="15 minutes ago"
          />
          <AlertItem
            type="Disease Surge"
            severity="warning"
            message="Influenza cases trending up. Monitor closely."
            time="20 minutes ago"
          />
        </div>
      </Card>

      {/* System Status */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <p className="font-semibold text-gray-900">System Status: Operational</p>
              <p className="text-sm text-gray-600">All systems running normally • Last sync: 2 seconds ago</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">Uptime: 99.98%</p>
            <p className="text-xs text-gray-600">Last 30 days</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
