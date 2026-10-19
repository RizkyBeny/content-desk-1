import { Node, mergeAttributes } from "@tiptap/core";

/** Minimal block-image node so articles can embed media (FR-ED-6). */
export const ArticleImage = Node.create({
  name: "articleImage",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      assetId: { default: null },
      alt: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "img[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes, { class: "my-3 max-w-full rounded-xl" })];
  },
});
