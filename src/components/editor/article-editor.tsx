"use client";

import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button, toast } from "@heroui/react";
import { ImageIcon, SparkIcon } from "@/components/ui/icons";
import { post } from "@/lib/client";
import { ArticleImage } from "./article/image-node";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import { EditorFrame } from "./frame/editor-frame";
import { AssetRail } from "./frame/asset-rail";
import { StageBar } from "./frame/stage";
import { TypographySection } from "./frame/sections";
import type { TypeEditorProps } from "./frame/types";
import type { ArticleEditorState } from "@/types";

const PROSE =
  "min-h-[320px] outline-none [&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-blue-600 [&_a]:underline dark:[&_blockquote]:border-white/20";

export function ArticleEditor({ creation, controller, chrome, ui, patchUi }: TypeEditorProps) {
  const state = controller.state as ArticleEditorState;
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, ArticleImage],
    content: state.html,
    editorProps: { attributes: { class: "focus:outline-none" } },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      controller.setState((s) => (s.type === "article" ? { ...s, html } : s), { record: false });
    },
  });

  const text = editor?.getText() ?? "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  async function revise(action: "tone" | "shorten" | "expand") {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selected = from === to ? editor.getText() : editor.state.doc.textBetween(from, to, " ");
    if (!selected.trim()) {
      toast.warning("Pilih teks atau tulis konten terlebih dahulu.");
      return;
    }
    setBusy(action);
    try {
      const res = await post<{ text: string }>(`/api/creations/${creation.id}/revise-text`, {
        text: selected,
        action,
      });
      if (from === to) editor.commands.setContent(res.text);
      else editor.chain().focus().insertContentAt({ from, to }, res.text).run();
      toast.success("Teks direvisi.");
    } catch (e) {
      toast.danger((e as Error).message ?? "Gagal merevisi teks.");
    } finally {
      setBusy(null);
    }
  }

  function onPick(sel: MediaSelection) {
    setPicker(false);
    if (!sel.asset || !sel.asset.fileUrl || !editor) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "articleImage",
        attrs: { src: sel.asset.fileUrl, assetId: sel.asset.id, alt: sel.asset.name },
      })
      .run();
  }

  const btn = "rounded-lg px-2 py-1 text-xs font-medium transition-colors";
  const off = "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200";
  const on = "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900";

  // ── Stage — editor teks lebar penuh ─────────────────────────────────────
  const stage = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <StageBar
        controller={controller}
        onSwapAsset={() => setPicker(true)}
        swapLabel="Sisip Gambar"
        right={
          <span className="mr-1 hidden rounded-md bg-zinc-100 px-2 py-1 text-xs tabular-nums text-zinc-500 sm:inline dark:bg-zinc-800 dark:text-zinc-400">
            {words} kata · {chars} karakter
          </span>
        }
      />

      {!editor ? (
        <p className="text-sm text-zinc-500">Memuat editor…</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-1">
            <button className={`${btn} ${editor.isActive("bold") ? on : off}`} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
            <button className={`${btn} ${editor.isActive("italic") ? on : off}`} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
            <button className={`${btn} ${editor.isActive("underline") ? on : off}`} onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
            <button className={`${btn} ${editor.isActive("heading", { level: 2 }) ? on : off}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
            <button className={`${btn} ${editor.isActive("heading", { level: 3 }) ? on : off}`} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
            <button className={`${btn} ${editor.isActive("bulletList") ? on : off}`} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
            <button className={`${btn} ${editor.isActive("orderedList") ? on : off}`} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
            <button className={`${btn} ${editor.isActive("blockquote") ? on : off}`} onClick={() => editor.chain().focus().toggleBlockquote().run()}>Kutipan</button>
            <button
              className={`${btn} ${off}`}
              onClick={() => {
                const url = window.prompt("URL tautan:");
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
            >
              Tautan
            </button>
            <button className={`${btn} ${off}`} onClick={() => setPicker(true)}>
              <ImageIcon width={13} height={13} className="mr-1 inline" /> Gambar
            </button>
            <span className="mx-1 h-4 w-px bg-zinc-300 dark:bg-white/15" />
            <button className={`${btn} ${off}`} onClick={() => editor.chain().focus().undo().run()}>Undo</button>
            <button className={`${btn} ${off}`} onClick={() => editor.chain().focus().redo().run()}>Redo</button>
          </div>

          <div className="min-h-0 flex-1 rounded-xl border border-zinc-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-zinc-900/50">
            <EditorContent editor={editor} className={PROSE} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              {words} kata · {chars} karakter
            </span>
            <span className="flex gap-1">
              <Button size="sm" variant="secondary" isDisabled={!!busy} onPress={() => revise("tone")}>
                <SparkIcon width={14} height={14} /> Ubah nada
              </Button>
              <Button size="sm" variant="secondary" isDisabled={!!busy} onPress={() => revise("shorten")}>
                Ringkas
              </Button>
              <Button size="sm" variant="secondary" isDisabled={!!busy} onPress={() => revise("expand")}>
                Perpanjang
              </Button>
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // ── Panel Properties — artikel hanya Typography ─────────────────────────
  const panel = <TypographySection ui={ui} patchUi={patchUi} />;

  return (
    <>
      {/* Rail tanpa handler — aset tidak diterapkan langsung ke artikel. */}
      <EditorFrame
        chrome={chrome}
        rail={<AssetRail creation={creation} backHref={chrome.backHref} />}
        stage={stage}
        panel={panel}
      />
      <MediaSourcePicker open={picker} onClose={() => setPicker(false)} type="image" onSelect={onPick} />
    </>
  );
}
