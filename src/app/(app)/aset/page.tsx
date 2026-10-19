"use client";

import { SectionHeader } from "@/components/ui/primitives";
import { AssetLibrary } from "@/components/asset/asset-library";

export default function AsetPage() {
  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        title="Aset"
        description="Pustaka media: gambar."
      />
      <AssetLibrary typeFilter="image" />
    </div>
  );
}
