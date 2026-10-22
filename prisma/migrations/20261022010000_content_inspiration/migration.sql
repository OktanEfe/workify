ALTER TABLE "ContentItem" ADD COLUMN "referenceLinks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ContentItem" ADD COLUMN "importKey" TEXT;
CREATE UNIQUE INDEX "ContentItem_organizationId_brandId_importKey_key" ON "ContentItem"("organizationId", "brandId", "importKey");
