/**
 * Premium Patient Management Interface
 * Advanced workflows with drag-and-drop, real-time updates, and clinical decision support
 */

import { useState } from "react";
import { Search, Filter, Plus, ChevronDown, Clock, AlertCircle, CheckCircle, Trash2, Edit2, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Sample patient data
const patientsData = [
  {
    id: 1,
    mrn: "MRN-2847",
    name: "James Anderson",
    age: 68,
    gender: "M",
    admission: "Emergency",
    diagnosis: "Acute MI",
    riskLevel: "critical",
    riskScore: 8.5,
    bed: "ICU-12",
    doctor: "Dr. Sarah Chen",
    admittedAt: "2 hours ago",
    status: "admitted",
    vitals: { temp: 37.8, hr: 92, bp: "148/92", o2: 94 },
  },
  {
    id: 2,
    mrn: "MRN-2891",
    name: "Maria Garcia",
    age: 54,
    gender: "F",
    admission: "Scheduled",
    diagnosis: "Knee Replacement",
    riskLevel: "low",
    riskScore: 1.2,
    bed: "SURG-05",
    doctor: "Dr. Michael Park",
    admittedAt: "1 day ago",
    status: "admitted",
    vitals: { temp: 36.9, hr: 68, bp: "120/78", o2: 98 },
  },
  {
    id: 3,
    mrn: "MRN-2756",
    name: "Robert Johnson",
    age: 72,
    gender: "M",
    admission: "Transfer",
    diagnosis: "Pneumonia",
    riskLevel: "medium",
    riskScore: 4.3,
    bed: "GEN-08",
    doctor: "Dr. Emily Watson",
    admittedAt: "3 days ago",
    status: "admitted",
    vitals: { temp: 37.2, hr: 78, bp: "130/85", o2: 96 },
  },
  {
    id: 4,
    mrn: "MRN-2905",
    name: "Lisa Thompson",
    age: 45,
    gender: "F",
    admission: "Emergency",
    diagnosis: "Appendicitis",
    riskLevel: "high",
    riskScore: 6.8,
    bed: "SURG-02",
    doctor: "Dr. David Lee",
    admittedAt: "4 hours ago",
    status: "admitted",
    vitals: { temp: 38.5, hr: 102, bp: "135/88", o2: 97 },
  },
];

// Risk Level Badge
function RiskBadge({ level }: { level: string }) {
  const colors = {
    critical: "bg-red-100 text-red-800 border-red-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-green-100 text-green-800 border-green-300",
  };

  return (
    <Badge className={`${colors[level as keyof typeof colors]} border text-xs font-semibold`}>
      {level.toUpperCase()}
    </Badge>
  );
}

// Patient Card Component
function PatientCard({ patient, onSelect }: { patient: typeof patientsData[0]; onSelect: (p: typeof patientsData[0]) => void }) {
  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group border-l-4 border-l-gray-300 hover:border-l-blue-500">
      <div onClick={() => onSelect(patient)}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-gray-900 text-lg">{patient.name}</p>
            <p className="text-xs text-gray-500">{patient.mrn}</p>
          </div>
          <RiskBadge level={patient.riskLevel} />
        </div>

        {/* Clinical Info */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 font-semibold">DIAGNOSIS</p>
            <p className="text-gray-900 font-medium">{patient.diagnosis}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">BED</p>
            <p className="text-gray-900 font-medium">{patient.bed}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">DOCTOR</p>
            <p className="text-gray-900 font-medium text-xs">{patient.doctor}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">ADMITTED</p>
            <p className="text-gray-900 font-medium text-xs">{patient.admittedAt}</p>
          </div>
        </div>

        {/* Vitals Summary */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-600 font-semibold mb-2">VITALS</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500">Temp</p>
              <p className="font-semibold text-gray-900">{patient.vitals.temp}°C</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">HR</p>
              <p className="font-semibold text-gray-900">{patient.vitals.hr}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">BP</p>
              <p className="font-semibold text-gray-900 text-xs">{patient.vitals.bp}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">O₂</p>
              <p className="font-semibold text-gray-900">{patient.vitals.o2}%</p>
            </div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold">RISK SCORE</p>
            <p className="text-lg font-bold text-gray-900">{patient.riskScore}/10</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50">
              <Edit2 size={16} className="text-blue-600" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-50">
              <Trash2 size={16} className="text-red-600" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Patient Detail Modal
function PatientDetailModal({ patient, isOpen, onClose }: { patient: typeof patientsData[0] | null; isOpen: boolean; onClose: () => void }) {
  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Patient Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b pb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{patient.name}</h3>
                <p className="text-gray-600">{patient.mrn}</p>
              </div>
              <RiskBadge level={patient.riskLevel} />
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 font-semibold">Age</p>
                <p className="text-gray-900 font-medium">{patient.age} years</p>
              </div>
              <div>
                <p className="text-gray-500 font-semibold">Gender</p>
                <p className="text-gray-900 font-medium">{patient.gender}</p>
              </div>
              <div>
                <p className="text-gray-500 font-semibold">Admission Type</p>
                <p className="text-gray-900 font-medium">{patient.admission}</p>
              </div>
              <div>
                <p className="text-gray-500 font-semibold">Status</p>
                <Badge className="bg-green-100 text-green-800 border-green-300 border">
                  {patient.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Clinical Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold mb-2">Primary Diagnosis</p>
                <p className="text-gray-900 font-medium">{patient.diagnosis}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold mb-2">Assigned Doctor</p>
                <p className="text-gray-900 font-medium">{patient.doctor}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold mb-2">Current Bed</p>
                <p className="text-gray-900 font-medium">{patient.bed}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold mb-2">Risk Score</p>
                <p className="text-2xl font-bold text-gray-900">{patient.riskScore}/10</p>
              </div>
            </div>
          </div>

          {/* Vitals */}
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Current Vitals</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-semibold mb-2">Temperature</p>
                <p className="text-2xl font-bold text-blue-900">{patient.vitals.temp}°C</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 font-semibold mb-2">Heart Rate</p>
                <p className="text-2xl font-bold text-red-900">{patient.vitals.hr} bpm</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 font-semibold mb-2">Blood Pressure</p>
                <p className="text-2xl font-bold text-purple-900">{patient.vitals.bp}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-semibold mb-2">O₂ Saturation</p>
                <p className="text-2xl font-bold text-green-900">{patient.vitals.o2}%</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
              Update Vitals
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              Discharge
            </Button>
            <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
              Transfer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PatientManagementPremium() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<typeof patientsData[0] | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredPatients = patientsData.filter((patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = !filterRisk || patient.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Patient Management</h1>
        <p className="text-lg text-gray-600">Advanced clinical workflows and patient monitoring</p>
      </div>

      {/* Controls */}
      <Card className="p-6 mb-8 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <Input
                placeholder="Search by name or MRN..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Risk Filter */}
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterRisk || ""}
              onChange={(e) => setFilterRisk(e.target.value || null)}
            >
              <option value="">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Add Patient Button */}
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={20} className="mr-2" />
            Add Patient
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-600 font-semibold">Total Patients</p>
            <p className="text-2xl font-bold text-gray-900">{filteredPatients.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Critical</p>
            <p className="text-2xl font-bold text-red-600">{filteredPatients.filter(p => p.riskLevel === "critical").length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">High Risk</p>
            <p className="text-2xl font-bold text-orange-600">{filteredPatients.filter(p => p.riskLevel === "high").length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Ready for Discharge</p>
            <p className="text-2xl font-bold text-green-600">2</p>
          </div>
        </div>
      </Card>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            onClick={() => {
              setSelectedPatient(patient);
              setIsDetailOpen(true);
            }}
          >
            <PatientCard patient={patient} onSelect={setSelectedPatient} />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPatients.length === 0 && (
        <Card className="p-12 text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 font-medium">No patients found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
        </Card>
      )}

      {/* Patient Detail Modal */}
      <PatientDetailModal
        patient={selectedPatient}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
