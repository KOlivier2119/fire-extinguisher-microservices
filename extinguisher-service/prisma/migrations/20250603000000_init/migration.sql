-- CreateEnum
CREATE TYPE "ExtinguisherType" AS ENUM ('WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL');
CREATE TYPE "ExtinguisherSize" AS ENUM ('LB_1_5', 'LB_5', 'LB_9', 'LB_12');
CREATE TYPE "ExtinguisherStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'UNDER_MAINTENANCE', 'DECOMMISSIONED');
CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED');

CREATE TABLE "FireExtinguisher" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" "ExtinguisherType" NOT NULL,
    "size" "ExtinguisherSize" NOT NULL,
    "installationDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "ExtinguisherStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FireExtinguisher_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "extinguisherId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'PENDING',
    "assignedInspectorId" TEXT NOT NULL,
    "assignedInspectorEmail" TEXT,
    "createdById" TEXT NOT NULL,
    "createdByEmail" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaintenanceLog" (
    "id" TEXT NOT NULL,
    "extinguisherId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "inspectorEmail" TEXT,
    "actionTaken" TEXT NOT NULL,
    "maintenanceDate" TIMESTAMP(3) NOT NULL,
    "issuesIdentified" TEXT,
    "notes" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FireExtinguisher_serialNumber_key" ON "FireExtinguisher"("serialNumber");
CREATE INDEX "FireExtinguisher_expiryDate_idx" ON "FireExtinguisher"("expiryDate");
CREATE INDEX "FireExtinguisher_status_idx" ON "FireExtinguisher"("status");
CREATE INDEX "Inspection_scheduledDate_idx" ON "Inspection"("scheduledDate");
CREATE INDEX "Inspection_status_idx" ON "Inspection"("status");
CREATE INDEX "Inspection_assignedInspectorId_idx" ON "Inspection"("assignedInspectorId");
CREATE INDEX "MaintenanceLog_maintenanceDate_idx" ON "MaintenanceLog"("maintenanceDate");
CREATE INDEX "MaintenanceLog_extinguisherId_idx" ON "MaintenanceLog"("extinguisherId");

ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_extinguisherId_fkey" FOREIGN KEY ("extinguisherId") REFERENCES "FireExtinguisher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_extinguisherId_fkey" FOREIGN KEY ("extinguisherId") REFERENCES "FireExtinguisher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
