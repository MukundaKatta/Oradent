-- Additive-only migration: introduces AdvancedOdontogramChart, storing the
-- opaque react-advanced-odontogram engine payload per patient. Does not
-- touch ToothCondition (legacy dental chart) or any other existing table.
-- See ODONTOGRAM_DATA_MAPPING.md for the rationale (the package's payload
-- has no documented per-field shape, so it is stored as a versioned blob).

-- CreateTable
CREATE TABLE "AdvancedOdontogramChart" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "statusChart" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvancedOdontogramChart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvancedOdontogramChart_patientId_key" ON "AdvancedOdontogramChart"("patientId");

-- CreateIndex
CREATE INDEX "AdvancedOdontogramChart_patientId_idx" ON "AdvancedOdontogramChart"("patientId");

-- AddForeignKey
ALTER TABLE "AdvancedOdontogramChart" ADD CONSTRAINT "AdvancedOdontogramChart_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvancedOdontogramChart" ADD CONSTRAINT "AdvancedOdontogramChart_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
