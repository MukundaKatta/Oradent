-- CreateEnum
CREATE TYPE "OrthodonticApplianceType" AS ENUM ('FIXED_METAL', 'FIXED_CERAMIC', 'LINGUAL', 'ALIGNER', 'RETAINER');

-- CreateEnum
CREATE TYPE "OrthodonticCaseStatus" AS ENUM ('ACTIVE', 'RETENTION', 'COMPLETED', 'DISCONTINUED');

-- CreateTable
CREATE TABLE "OrthodonticCase" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "applianceType" "OrthodonticApplianceType" NOT NULL,
    "status" "OrthodonticCaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "estimatedEndDate" TIMESTAMP(3),
    "totalAlignerSteps" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrthodonticCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrthodonticVisit" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "wireChanged" BOOLEAN NOT NULL DEFAULT false,
    "wireStrength" TEXT,
    "elasticsUsed" TEXT,
    "alignerStepNumber" INTEGER,
    "notes" TEXT,
    "nextVisitDate" TIMESTAMP(3),
    "treatmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrthodonticVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrthodonticCase_patientId_idx" ON "OrthodonticCase"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "OrthodonticVisit_treatmentId_key" ON "OrthodonticVisit"("treatmentId");

-- CreateIndex
CREATE INDEX "OrthodonticVisit_caseId_idx" ON "OrthodonticVisit"("caseId");

-- AddForeignKey
ALTER TABLE "OrthodonticCase" ADD CONSTRAINT "OrthodonticCase_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrthodonticCase" ADD CONSTRAINT "OrthodonticCase_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrthodonticVisit" ADD CONSTRAINT "OrthodonticVisit_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "OrthodonticCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrthodonticVisit" ADD CONSTRAINT "OrthodonticVisit_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrthodonticVisit" ADD CONSTRAINT "OrthodonticVisit_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
