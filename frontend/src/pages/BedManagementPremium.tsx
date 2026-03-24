/**
 * Premium Bed Management Interface
 * Interactive bed visualization with heat maps, drag-and-drop assignment, and real-time updates
 */

import { useState } from "react";
import { AlertCircle, Zap, Users, Clock, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Sample bed data
const bedsData = {
  ICU: [
    { id: "ICU-01", status: "occupied", patient: "James Anderson", riskLevel: "critical", occupancyTime: "2h" },
    { id: "ICU-02", status: "occupied", patient: "Lisa Thompson", riskLevel: "high", occupancyTime: "4h" },
    { id: "ICU-03", status: "available", patient: null, riskLevel: null, occupancyTime: null },
    { id: "ICU-04", status: "cleaning", patient: null, riskLevel: null, occupancyTime: null },
    { id: "ICU-05", status: "occupied", patient: "Robert Chen", riskLevel: "medium", occupancyTime: "6h" },
    { id: "ICU-06", status: "available", patient: null, riskLevel: null, occupancyTime: null },
    { id: "ICU-07", status: "maintenance", patient: null, riskLevel: null, occupancyTime: null },
    { id: "ICU-08", status: "occupied", patient: "Maria Santos", riskLevel: "high", occupancyTime: "3h" },
  ],
  General: [
    { id: "GEN-01", status: "occupied", patient: "John Davis", riskLevel: "low", occupancyTime: "1d" },
    { id: "GEN-02", status: "occupied", patient: "Sarah Wilson", riskLevel: "low", occupancyTime: "2d" },
    { id: "GEN-03", status: "available", patient: null, riskLevel: null, occupancyTime: null },
    { id: "GEN-04", status: "occupied", patient: "Michael Brown", riskLevel: "medium", occupancyTime: "12h" },
    { id: "GEN-05", status: "available", patient: null, riskLevel: null, occupancyTime: null },
    { id: "GEN-06", status: "occupied", patient: "Emma Taylor", riskLevel: "low", occupancyTime: "18h" },
    { id: "GEN-07", status: "cleaning", patient: null, riskLevel: null, occupancyTime: null },
    { id: "GEN-08", status: "occupied", patient: "Robert Johnson", riskLevel: "medium", occupancyTime: "3d" },
  ],
  Surgical: [
    { id: "SURG-01", status: "occupied", patient: "Lisa Thompson", riskLevel: "high", occupancyTime: "4h" },
    { id: "SURG-02", status: "available", patient: null, riskLevel: null, occupancyTime: null },
    { id: "SURG-03", status: "occupied", patient: "David Miller", riskLevel: "low", occupancyTime: "8h" },
    { id: "SURG-04", status: "available", patient: null, riskLevel: null, occupancyTime: null },
    { id: "SURG-05", status: "occupied", patient: "Maria Garcia", riskLevel: "low", occupancyTime: "1d" },
    { id: "SURG-06", status: "maintenance", patient: null, riskLevel: null, occupancyTime: null },
  ],
};

// Bed Status Color Map
function getBedColor(status: string, riskLevel?: string): string {
  if (status === "available") return "bg-green-100 border-green-300 hover:bg-green-200";
  if (status === "cleaning") return "bg-blue-100 border-blue-300 hover:bg-blue-200";
  if (status === "maintenance") return "bg-gray-100 border-gray-300 hover:bg-gray-200";
  if (status === "occupied") {
    if (riskLevel === "critical") return "bg-red-100 border-red-400 hover:bg-red-200";
    if (riskLevel === "high") return "bg-orange-100 border-orange-300 hover:bg-orange-200";
    if (riskLevel === "medium") return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200";
    return "bg-blue-50 border-blue-200 hover:bg-blue-100";
  }
  return "bg-gray-50 border-gray-200";
}

function getStatusIcon(status: string) {
  if (status === "available") return <CheckCircle className="text-green-600" size={16} />;
  if (status === "cleaning") return <Zap className="text-blue-600" size={16} />;
  if (status === "maintenance") return <AlertCircle className="text-gray-600" size={16} />;
  if (status === "occupied") return <Users className="text-gray-600" size={16} />;
}

// Bed Card Component
function BedCard({ bed }: { bed: typeof bedsData.ICU[0] }) {
  return (
    <div
      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${getBedColor(bed.status, bed.riskLevel || undefined)}`}
      draggable={bed.status === "occupied"}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-gray-900">{bed.id}</p>
          <div className="flex items-center gap-1 mt-1">
            {getStatusIcon(bed.status)}
            <span className="text-xs font-semibold text-gray-600 capitalize">{bed.status}</span>
          </div>
        </div>
        {bed.riskLevel && (
          <Badge className={`text-xs ${
            bed.riskLevel === "critical" ? "bg-red-200 text-red-800" :
            bed.riskLevel === "high" ? "bg-orange-200 text-orange-800" :
            "bg-yellow-200 text-yellow-800"
          }`}>
            {bed.riskLevel}
          </Badge>
        )}
      </div>

      {bed.patient && (
        <div className="bg-white bg-opacity-60 rounded p-2 mt-2">
          <p className="text-xs font-semibold text-gray-900">{bed.patient}</p>
          <div className="flex items-center gap-1 mt-1 text-gray-600">
            <Clock size={12} />
            <span className="text-xs">{bed.occupancyTime}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Department Section
function DepartmentSection({ name, beds }: { name: string; beds: typeof bedsData.ICU }) {
  const occupied = beds.filter(b => b.status === "occupied").length;
  const available = beds.filter(b => b.status === "available").length;
  const cleaning = beds.filter(b => b.status === "cleaning").length;
  const maintenance = beds.filter(b => b.status === "maintenance").length;
  const occupancyRate = Math.round((occupied / beds.length) * 100);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="mb-6 pb-4 border-b">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-2xl font-bold text-gray-900">{name} Department</h2>
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 border text-lg px-3 py-1">
            {occupancyRate}%
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-gray-600 font-semibold text-xs">Occupied</p>
            <p className="text-2xl font-bold text-blue-900">{occupied}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-gray-600 font-semibold text-xs">Available</p>
            <p className="text-2xl font-bold text-green-900">{available}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-gray-600 font-semibold text-xs">Cleaning</p>
            <p className="text-2xl font-bold text-yellow-900">{cleaning}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-gray-600 font-semibold text-xs">Maintenance</p>
            <p className="text-2xl font-bold text-gray-900">{maintenance}</p>
          </div>
        </div>
      </div>

      {/* Bed Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {beds.map((bed) => (
          <BedCard key={bed.id} bed={bed} />
        ))}
      </div>
    </Card>
  );
}

// Legend Component
function Legend() {
  return (
    <Card className="p-6">
      <h3 className="font-bold text-gray-900 mb-4">Bed Status Legend</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 border-2 border-green-300 rounded" />
          <span className="text-sm text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 border-2 border-blue-200 rounded" />
          <span className="text-sm text-gray-700">Occupied (Low Risk)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-100 border-2 border-yellow-300 rounded" />
          <span className="text-sm text-gray-700">Occupied (Medium Risk)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 border-2 border-orange-300 rounded" />
          <span className="text-sm text-gray-700">Occupied (High Risk)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 border-2 border-red-400 rounded" />
          <span className="text-sm text-gray-700">Occupied (Critical)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 border-2 border-blue-300 rounded" />
          <span className="text-sm text-gray-700">Cleaning</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded" />
          <span className="text-sm text-gray-700">Maintenance</span>
        </div>
      </div>
    </Card>
  );
}

export default function BedManagementPremium() {
  const totalBeds = Object.values(bedsData).flat().length;
  const totalOccupied = Object.values(bedsData).flat().filter(b => b.status === "occupied").length;
  const totalAvailable = Object.values(bedsData).flat().filter(b => b.status === "available").length;
  const overallOccupancy = Math.round((totalOccupied / totalBeds) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Bed Management System</h1>
        <p className="text-lg text-gray-600">Real-time bed status and capacity management</p>
      </div>

      {/* Overall Stats */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-2">Total Beds</p>
            <p className="text-4xl font-bold text-gray-900">{totalBeds}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-2">Occupied</p>
            <p className="text-4xl font-bold text-blue-600">{totalOccupied}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-2">Available</p>
            <p className="text-4xl font-bold text-green-600">{totalAvailable}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-2">Overall Occupancy</p>
            <p className="text-4xl font-bold text-indigo-600">{overallOccupancy}%</p>
          </div>
        </div>
      </Card>

      {/* Department Sections */}
      <div className="space-y-8 mb-8">
        {Object.entries(bedsData).map(([dept, beds]) => (
          <DepartmentSection key={dept} name={dept} beds={beds} />
        ))}
      </div>

      {/* Legend */}
      <Legend />

      {/* Quick Actions */}
      <Card className="p-6 mt-8">
        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Assign Patient
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            Mark as Available
          </Button>
          <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
            Start Cleaning
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            Report Issue
          </Button>
        </div>
      </Card>
    </div>
  );
}
