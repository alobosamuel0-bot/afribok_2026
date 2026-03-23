/**
 * Enterprise Healthcare Database Schema
 * Designed to match Cleveland Clinic and Mayo Clinic standards
 * 
 * Core principles:
 * - HIPAA compliance
 * - Normalized data structure
 * - Audit trails for all changes
 * - Support for complex clinical workflows
 * - Real-time analytics capability
 */

import {
  int,
  varchar,
  text,
  timestamp,
  decimal,
  boolean,
  mysqlEnum,
  mysqlTable,
  index,
  foreignKey,
  unique,
  json,
} from "drizzle-orm/mysql-core";

// ============================================================================
// CORE ENTITIES
// ============================================================================

export const hospitals = mysqlTable("hospitals", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  totalBeds: int("totalBeds").default(0),
  icuBeds: int("icuBeds").default(0),
  emergencyBeds: int("emergencyBeds").default(0),
  accreditation: varchar("accreditation", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  codeIdx: index("hospital_code_idx").on(table.code),
}));

export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospitalId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  type: mysqlEnum("type", ["ICU", "Emergency", "General", "Surgical", "Pediatric", "Psychiatric", "Other"]).notNull(),
  head: varchar("head", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  beds: int("beds").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  hospitalIdx: index("dept_hospital_idx").on(table.hospitalId),
  uniqueDept: unique("unique_dept_code").on(table.hospitalId, table.code),
}));

export const doctors = mysqlTable("doctors", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospitalId").notNull(),
  departmentId: int("departmentId").notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  license: varchar("license", { length: 100 }).notNull().unique(),
  specialization: varchar("specialization", { length: 255 }),
  qualification: text("qualification"),
  yearsOfExperience: int("yearsOfExperience").default(0),
  status: mysqlEnum("status", ["active", "inactive", "on_leave", "retired"]).default("active"),
  maxPatientsPerDay: int("maxPatientsPerDay").default(20),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  hospitalIdx: index("doctor_hospital_idx").on(table.hospitalId),
  deptIdx: index("doctor_dept_idx").on(table.departmentId),
  licenseIdx: index("doctor_license_idx").on(table.license),
}));

export const beds = mysqlTable("beds", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospitalId").notNull(),
  departmentId: int("departmentId").notNull(),
  bedNumber: varchar("bedNumber", { length: 50 }).notNull(),
  bedType: mysqlEnum("bedType", ["Standard", "ICU", "Isolation", "Negative_Pressure", "Pediatric"]).notNull(),
  status: mysqlEnum("status", ["available", "occupied", "cleaning", "maintenance", "reserved"]).default("available"),
  currentPatientId: int("currentPatientId"),
  lastCleaned: timestamp("lastCleaned"),
  equipment: json("equipment").$type<string[]>(), // ["ventilator", "monitor", etc]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  hospitalIdx: index("bed_hospital_idx").on(table.hospitalId),
  deptIdx: index("bed_dept_idx").on(table.departmentId),
  statusIdx: index("bed_status_idx").on(table.status),
  uniqueBed: unique("unique_bed").on(table.hospitalId, table.bedNumber),
}));

// ============================================================================
// PATIENT MANAGEMENT
// ============================================================================

export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospitalId").notNull(),
  mrn: varchar("mrn", { length: 50 }).notNull(), // Medical Record Number
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  dateOfBirth: timestamp("dateOfBirth"),
  gender: mysqlEnum("gender", ["M", "F", "Other"]),
  bloodType: varchar("bloodType", { length: 5 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  emergencyPhone: varchar("emergencyPhone", { length: 20 }),
  insuranceProvider: varchar("insuranceProvider", { length: 255 }),
  insurancePolicyNumber: varchar("insurancePolicyNumber", { length: 100 }),
  allergies: text("allergies"),
  chronicConditions: json("chronicConditions").$type<string[]>(),
  currentMedications: json("currentMedications").$type<string[]>(),
  admissionStatus: mysqlEnum("admissionStatus", ["admitted", "discharged", "transferred", "deceased"]).default("admitted"),
  currentBedId: int("currentBedId"),
  assignedDoctorId: int("assignedDoctorId"),
  riskScore: decimal("riskScore", 5, 2).default("0"),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("low"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  hospitalIdx: index("patient_hospital_idx").on(table.hospitalId),
  mrnIdx: unique("unique_mrn").on(table.hospitalId, table.mrn),
  statusIdx: index("patient_status_idx").on(table.admissionStatus),
  riskIdx: index("patient_risk_idx").on(table.riskLevel),
}));

export const admissions = mysqlTable("admissions", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  hospitalId: int("hospitalId").notNull(),
  departmentId: int("departmentId").notNull(),
  admissionDate: timestamp("admissionDate").notNull(),
  admissionType: mysqlEnum("admissionType", ["Emergency", "Scheduled", "Transfer", "Readmission"]).notNull(),
  primaryDiagnosis: varchar("primaryDiagnosis", { length: 255 }),
  secondaryDiagnosis: text("secondaryDiagnosis"),
  admittingDoctor: int("admittingDoctor"),
  dischargeDate: timestamp("dischargeDate"),
  dischargeType: mysqlEnum("dischargeType", ["Home", "Transfer", "AMA", "Deceased", "Other"]),
  dischargeNotes: text("dischargeNotes"),
  lengthOfStay: int("lengthOfStay"),
  outcome: mysqlEnum("outcome", ["recovered", "improved", "stable", "declined", "deceased"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  patientIdx: index("admission_patient_idx").on(table.patientId),
  hospitalIdx: index("admission_hospital_idx").on(table.hospitalId),
  dateIdx: index("admission_date_idx").on(table.admissionDate),
}));

// ============================================================================
// CLINICAL DATA
// ============================================================================

export const vitals = mysqlTable("vitals", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  admissionId: int("admissionId").notNull(),
  recordedAt: timestamp("recordedAt").notNull(),
  temperature: decimal("temperature", 5, 2), // Celsius
  heartRate: int("heartRate"), // bpm
  systolicBP: int("systolicBP"), // mmHg
  diastolicBP: int("diastolicBP"), // mmHg
  respiratoryRate: int("respiratoryRate"), // breaths/min
  oxygenSaturation: decimal("oxygenSaturation", 5, 2), // %
  bloodGlucose: decimal("bloodGlucose", 7, 2), // mg/dL
  weight: decimal("weight", 7, 2), // kg
  height: decimal("height", 5, 2), // cm
  notes: text("notes"),
  recordedBy: int("recordedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  patientIdx: index("vitals_patient_idx").on(table.patientId),
  admissionIdx: index("vitals_admission_idx").on(table.admissionId),
  timeIdx: index("vitals_time_idx").on(table.recordedAt),
}));

export const medications = mysqlTable("medications", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  admissionId: int("admissionId").notNull(),
  medicationName: varchar("medicationName", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 100 }).notNull(),
  frequency: varchar("frequency", { length: 100 }).notNull(),
  route: mysqlEnum("route", ["oral", "IV", "IM", "SC", "Topical", "Inhalation", "Other"]).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  prescribedBy: int("prescribedBy"),
  reason: text("reason"),
  sideEffects: text("sideEffects"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  patientIdx: index("med_patient_idx").on(table.patientId),
  admissionIdx: index("med_admission_idx").on(table.admissionId),
}));

export const labResults = mysqlTable("labResults", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  admissionId: int("admissionId").notNull(),
  testName: varchar("testName", { length: 255 }).notNull(),
  testCode: varchar("testCode", { length: 50 }).notNull(),
  value: varchar("value", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  referenceRange: varchar("referenceRange", { length: 100 }),
  status: mysqlEnum("status", ["normal", "abnormal", "critical"]).default("normal"),
  collectedAt: timestamp("collectedAt").notNull(),
  resultedAt: timestamp("resultedAt"),
  orderedBy: int("orderedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  patientIdx: index("lab_patient_idx").on(table.patientId),
  admissionIdx: index("lab_admission_idx").on(table.admissionId),
  statusIdx: index("lab_status_idx").on(table.status),
}));

// ============================================================================
// RISK ASSESSMENT & PREDICTIONS
// ============================================================================

export const riskAssessments = mysqlTable("riskAssessments", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  admissionId: int("admissionId").notNull(),
  assessmentDate: timestamp("assessmentDate").notNull(),
  riskScore: decimal("riskScore", 5, 2).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).notNull(),
  factors: json("factors").$type<Record<string, number>>(), // {age: 0.3, comorbidity: 0.5, etc}
  predictedOutcome: varchar("predictedOutcome", { length: 255 }),
  recommendedActions: text("recommendedActions"),
  assessedBy: int("assessedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  patientIdx: index("risk_patient_idx").on(table.patientId),
  admissionIdx: index("risk_admission_idx").on(table.admissionId),
  riskIdx: index("risk_level_idx").on(table.riskLevel),
}));

export const predictions = mysqlTable("predictions", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospitalId").notNull(),
  predictionType: mysqlEnum("predictionType", [
    "patient_load",
    "disease_surge",
    "bed_availability",
    "readmission_risk",
    "discharge_date",
    "mortality_risk",
    "length_of_stay"
  ]).notNull(),
  targetDate: timestamp("targetDate").notNull(),
  predictedValue: decimal("predictedValue", 10, 2),
  confidence: decimal("confidence", 5, 2), // 0-100%
  modelVersion: varchar("modelVersion", { length: 50 }),
  actualValue: decimal("actualValue", 10, 2),
  accuracy: decimal("accuracy", 5, 2),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  hospitalIdx: index("pred_hospital_idx").on(table.hospitalId),
  typeIdx: index("pred_type_idx").on(table.predictionType),
  dateIdx: index("pred_date_idx").on(table.targetDate),
}));

// ============================================================================
// NOTIFICATIONS & ALERTS
// ============================================================================

export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospitalId").notNull(),
  patientId: int("patientId"),
  alertType: mysqlEnum("alertType", [
    "high_risk_admission",
    "capacity_critical",
    "capacity_high",
    "disease_surge",
    "abnormal_vitals",
    "medication_interaction",
    "lab_critical",
    "readmission_risk",
    "discharge_ready"
  ]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).notNull(),
  message: text("message").notNull(),
  actionRequired: boolean("actionRequired").default(false),
  assignedTo: int("assignedTo"),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"]).default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, (table) => ({
  hospitalIdx: index("alert_hospital_idx").on(table.hospitalId),
  patientIdx: index("alert_patient_idx").on(table.patientId),
  typeIdx: index("alert_type_idx").on(table.alertType),
  severityIdx: index("alert_severity_idx").on(table.severity),
  statusIdx: index("alert_status_idx").on(table.status),
}));

// ============================================================================
// AUDIT & COMPLIANCE
// ============================================================================

export const auditLog = mysqlTable("auditLog", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospitalId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId").notNull(),
  changes: json("changes").$type<Record<string, any>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  hospitalIdx: index("audit_hospital_idx").on(table.hospitalId),
  userIdx: index("audit_user_idx").on(table.userId),
  actionIdx: index("audit_action_idx").on(table.action),
  timeIdx: index("audit_time_idx").on(table.createdAt),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = typeof hospitals.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = typeof doctors.$inferInsert;

export type Bed = typeof beds.$inferSelect;
export type InsertBed = typeof beds.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

export type Admission = typeof admissions.$inferSelect;
export type InsertAdmission = typeof admissions.$inferInsert;

export type Vital = typeof vitals.$inferSelect;
export type InsertVital = typeof vitals.$inferInsert;

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;

export type LabResult = typeof labResults.$inferSelect;
export type InsertLabResult = typeof labResults.$inferInsert;

export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = typeof riskAssessments.$inferInsert;

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;
