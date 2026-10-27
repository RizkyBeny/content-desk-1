"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CreationEditorView } from "@/components/editor/creation-editor-view";

function EditorContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const backHrefParam = searchParams.get("backHref");
  let backHref = backHrefParam || "/ai-studio/image?step=visual-brief";
  if (!backHrefParam) {
    if (from === "video") {
      backHref = "/ai-studio/video?step=storyboard";
    } else if (from === "carousel") {
      backHref = "/ai-studio/carousel";
    } else if (from === "brief") {
      backHref = "/ai-studio/brief";
    }
  }

  return <CreationEditorView backHref={backHref} />;
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#060607] text-white text-xs">
          Memuat Studio Editor...
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
