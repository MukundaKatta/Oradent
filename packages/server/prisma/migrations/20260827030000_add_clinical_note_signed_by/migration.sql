-- Additive-only migration: adds signedById to ClinicalNote so signing a note
-- records who signed it (previously PATCH /notes/:id/sign did not track this
-- at all). Nullable, no data backfill needed, no existing column touched.

-- AlterTable
ALTER TABLE "ClinicalNote" ADD COLUMN "signedById" TEXT;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
