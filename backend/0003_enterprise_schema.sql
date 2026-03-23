-- Enterprise Healthcare Schema Migration
-- Designed for Cleveland Clinic and Mayo Clinic standards

-- Hospitals
CREATE TABLE IF NOT EXISTS `hospitals` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL UNIQUE,
  `address` text,
  `city` varchar(100),
  `state` varchar(100),
  `country` varchar(100),
  `phone` varchar(20),
  `email` varchar(255),
  `website` varchar(255),
  `totalBeds` int DEFAULT 0,
  `icuBeds` int DEFAULT 0,
  `emergencyBeds` int DEFAULT 0,
  `accreditation` varchar(100),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `hospital_code_idx` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Departments
CREATE TABLE IF NOT EXISTS `departments` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `hospitalId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `type` enum('ICU','Emergency','General','Surgical','Pediatric','Psychiatric','Other') NOT NULL,
  `head` varchar(255),
  `phone` varchar(20),
  `beds` int DEFAULT 0,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `dept_hospital_idx` (`hospitalId`),
  UNIQUE KEY `unique_dept_code` (`hospitalId`, `code`),
  CONSTRAINT `fk_dept_hospital` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Doctors
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `hospitalId` int NOT NULL,
  `departmentId` int NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20),
  `license` varchar(100) NOT NULL UNIQUE,
  `specialization` varchar(255),
  `qualification` text,
  `yearsOfExperience` int DEFAULT 0,
  `status` enum('active','inactive','on_leave','retired') DEFAULT 'active',
  `maxPatientsPerDay` int DEFAULT 20,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `doctor_hospital_idx` (`hospitalId`),
  INDEX `doctor_dept_idx` (`departmentId`),
  INDEX `doctor_license_idx` (`license`),
  CONSTRAINT `fk_doctor_hospital` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doctor_dept` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Beds
CREATE TABLE IF NOT EXISTS `beds` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `hospitalId` int NOT NULL,
  `departmentId` int NOT NULL,
  `bedNumber` varchar(50) NOT NULL,
  `bedType` enum('Standard','ICU','Isolation','Negative_Pressure','Pediatric') NOT NULL,
  `status` enum('available','occupied','cleaning','maintenance','reserved') DEFAULT 'available',
  `currentPatientId` int,
  `lastCleaned` timestamp NULL,
  `equipment` json,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `bed_hospital_idx` (`hospitalId`),
  INDEX `bed_dept_idx` (`departmentId`),
  INDEX `bed_status_idx` (`status`),
  UNIQUE KEY `unique_bed` (`hospitalId`, `bedNumber`),
  CONSTRAINT `fk_bed_hospital` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bed_dept` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patients
CREATE TABLE IF NOT EXISTS `patients` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `hospitalId` int NOT NULL,
  `mrn` varchar(50) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `dateOfBirth` timestamp NULL,
  `gender` enum('M','F','Other'),
  `bloodType` varchar(5),
  `phone` varchar(20),
  `email` varchar(255),
  `address` text,
  `emergencyContact` varchar(255),
  `emergencyPhone` varchar(20),
  `insuranceProvider` varchar(255),
  `insurancePolicyNumber` varchar(100),
  `allergies` text,
  `chronicConditions` json,
  `currentMedications` json,
  `admissionStatus` enum('admitted','discharged','transferred','deceased') DEFAULT 'admitted',
  `currentBedId` int,
  `assignedDoctorId` int,
  `riskScore` decimal(5,2) DEFAULT 0,
  `riskLevel` enum('low','medium','high','critical') DEFAULT 'low',
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `patient_hospital_idx` (`hospitalId`),
  UNIQUE KEY `unique_mrn` (`hospitalId`, `mrn`),
  INDEX `patient_status_idx` (`admissionStatus`),
  INDEX `patient_risk_idx` (`riskLevel`),
  CONSTRAINT `fk_patient_hospital` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_patient_bed` FOREIGN KEY (`currentBedId`) REFERENCES `beds`(`id`) ON SET NULL,
  CONSTRAINT `fk_patient_doctor` FOREIGN KEY (`assignedDoctorId`) REFERENCES `doctors`(`id`) ON SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admissions
CREATE TABLE IF NOT EXISTS `admissions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `patientId` int NOT NULL,
  `hospitalId` int NOT NULL,
  `departmentId` int NOT NULL,
  `admissionDate` timestamp NOT NULL,
  `admissionType` enum('Emergency','Scheduled','Transfer','Readmission') NOT NULL,
  `primaryDiagnosis` varchar(255),
  `secondaryDiagnosis` text,
  `admittingDoctor` int,
  `dischargeDate` timestamp NULL,
  `dischargeType` enum('Home','Transfer','AMA','Deceased','Other'),
  `dischargeNotes` text,
  `lengthOfStay` int,
  `outcome` enum('recovered','improved','stable','declined','deceased'),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `admission_patient_idx` (`patientId`),
  INDEX `admission_hospital_idx` (`hospitalId`),
  INDEX `admission_date_idx` (`admissionDate`),
  CONSTRAINT `fk_admission_patient` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_admission_hospital` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_admission_dept` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_admission_doctor` FOREIGN KEY (`admittingDoctor`) REFERENCES `doctors`(`id`) ON SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vitals
CREATE TABLE IF NOT EXISTS `vitals` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `patientId` int NOT NULL,
  `admissionId` int NOT NULL,
  `recordedAt` timestamp NOT NULL,
  `temperature` decimal(5,2),
  `heartRate` int,
  `systolicBP` int,
  `diastolicBP` int,
  `respiratoryRate` int,
  `oxygenSaturation` decimal(5,2),
  `bloodGlucose` decimal(7,2),
  `weight` decimal(7,2),
  `height` decimal(5,2),
  `notes` text,
  `recordedBy` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `vitals_patient_idx` (`patientId`),
  INDEX `vitals_admission_idx` (`admissionId`),
  INDEX `vitals_time_idx` (`recordedAt`),
  CONSTRAINT `fk_vitals_patient` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vitals_admission` FOREIGN KEY (`admissionId`) REFERENCES `admissions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vitals_doctor` FOREIGN KEY (`recordedBy`) REFERENCES `doctors`(`id`) ON SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medications
CREATE TABLE IF NOT EXISTS `medications` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `patientId` int NOT NULL,
  `admissionId` int NOT NULL,
  `medicationName` varchar(255) NOT NULL,
  `dosage` varchar(100) NOT NULL,
  `frequency` varchar(100) NOT NULL,
  `route` enum('oral','IV','IM','SC','Topical','Inhalation','Other') NOT NULL,
  `startDate` timestamp NOT NULL,
  `endDate` timestamp NULL,
  `prescribedBy` int,
  `reason` text,
  `sideEffects` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `med_patient_idx` (`patientId`),
  INDEX `med_admission_idx` (`admissionId`),
  CONSTRAINT `fk_med_patient` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_med_admission` FOREIGN KEY (`admissionId`) REFERENCES `admissions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_med_doctor` FOREIGN KEY (`prescribedBy`) REFERENCES `doctors`(`id`) ON SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lab Results
CREATE TABLE IF NOT EXISTS `labResults` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `patientId` int NOT NULL,
  `admissionId` int NOT NULL,
  `testName` varchar(255) NOT NULL,
  `testCode` varchar(50) NOT NULL,
  `value` varchar(100),
  `unit` varchar(50),
  `referenceRange` varchar(100),
  `status` enum('normal','abnormal','critical') DEFAULT 'normal',
  `collectedAt` timestamp NOT NULL,
  `resultedAt` timestamp NULL,
  `orderedBy` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `lab_patient_idx` (`patientId`),
  INDEX `lab_admission_idx` (`admissionId`),
  INDEX `lab_status_idx` (`status`),
  CONSTRAINT `fk_lab_patient` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lab_admission` FOREIGN KEY (`admissionId`) REFERENCES `admissions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lab_doctor` FOREIGN KEY (`orderedBy`) REFERENCES `doctors`(`id`) ON SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Risk Assessments
CREATE TABLE IF NOT EXISTS `riskAssessments` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `patientId` int NOT NULL,
  `admissionId` int NOT NULL,
  `assessmentDate` timestamp NOT NULL,
  `riskScore` decimal(5,2) NOT NULL,
  `riskLevel` enum('low','medium','high','critical') NOT NULL,
  `factors` json,
  `predictedOutcome` varchar(255),
  `recommendedActions` text,
  `assessedBy` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `risk_patient_idx` (`patientId`),
  INDEX `risk_admission_idx` (`admissionId`),
  INDEX `risk_level_idx` (`riskLevel`),
  CONSTRAINT `fk_risk_patient` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_risk_admission` FOREIGN KEY (`admissionId`) REFERENCES `admissions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_risk_doctor` FOREIGN KEY (`assessedBy`) REFERENCES `doctors`(`id`) ON SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Predictions
CREATE TABLE IF NOT EXISTS `predictions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `hospitalId` int NOT NULL,
  `predictionType` enum('patient_load','disease_surge','bed_availability','readmission_risk','discharge_date','mortality_risk','length_of_stay') NOT NULL,
  `targetDate` timestamp NOT NULL,
  `predictedValue` decimal(10,2),
  `confidence` decimal(5,2),
  `modelVersion` varchar(50),
  `actualValue` decimal(10,2),
  `accuracy` decimal(5,2),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `pred_hospital_idx` (`hospitalId`),
  INDEX `pred_type_idx` (`predictionType`),
  INDEX `pred_date_idx` (`targetDate`),
  CONSTRAINT `fk_pred_hospital` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alerts
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `hospitalId` int NOT NULL,
  `patientId` int,
  `alertType` enum('high_risk_admission','capacity_critical','capacity_high','disease_surge','abnormal_vitals','medication_interaction','lab_critical','readmission_risk','discharge_ready') NOT NULL,
  `severity` enum('info','warning','critical') NOT NULL,
  `message` text NOT NULL,
  `actionRequired` boolean DEFAULT false,
  `assignedTo` int,
  `status` enum('open','acknowledged','resolved') DEFAULT 'open',
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `resolvedAt` timestamp NULL,
  INDEX `alert_hospital_idx` (`hospitalId`),
  INDEX `alert_patient_idx` (`patientId`),
  INDEX `alert_type_idx` (`alertType`),
  INDEX `alert_severity_idx` (`severity`),
  INDEX `alert_status_idx` (`status`),
  CONSTRAINT `fk_alert_hospital` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_alert_patient` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON SET NULL,
  CONSTRAINT `fk_alert_doctor` FOREIGN KEY (`assignedTo`) REFERENCES `doctors`(`id`) ON SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Log
CREATE TABLE IF NOT EXISTS `auditLog` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `hospitalId` int NOT NULL,
  `userId` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `entityType` varchar(50) NOT NULL,
  `entityId` int NOT NULL,
  `changes` json,
  `ipAddress` varchar(45),
  `userAgent` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `audit_hospital_idx` (`hospitalId`),
  INDEX `audit_user_idx` (`userId`),
  INDEX `audit_action_idx` (`action`),
  INDEX `audit_time_idx` (`createdAt`),
  CONSTRAINT `fk_audit_hospital` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
