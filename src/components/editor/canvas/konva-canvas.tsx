"use client";

import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import {
  Group,
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text as KonvaText,
  Transformer,
} from "react-konva";
import type { CanvasLayer, LayerPatch, Ratio, SlideObject } from "@/types";
import { CANVAS_DIMS } from "./dims";

function useHtmlImage(url?: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      if (!url) {
        if (active) setImg(null);
        return;
      }
      const el = new window.Image();
      el.crossOrigin = "anonymous";
      const loaded = new Promise<HTMLImageElement | null>((resolve) => {
        el.onload = () => resolve(el);
        el.onerror = () => resolve(null);
      });
      el.src = url;
      const result = await loaded;
      if (active) setImg(result);
    })();
    return () => {
      active = false;
    };
  }, [url]);
  return img;
}

function BackgroundImage({
  image,
  slide,
  w,
  h,
  fitMode = "fill",
}: {
  image: HTMLImageElement;
  slide: SlideObject;
  w: number;
  h: number;
  fitMode?: "fill" | "fit";
}) {
  const ref = useRef<Konva.Image>(null);
  const f = slide.filters ?? { brightness: 0, contrast: 0, saturation: 0 };
  const zoom = slide.scale ?? 1;
  const isContain = slide.background?.fit === "contain" || fitMode === "fit";
  const factor =
    (isContain
      ? Math.min(w / image.width, h / image.height)
      : Math.max(w / image.width, h / image.height)) * zoom;
  const dw = image.width * factor;
  const dh = image.height * factor;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.filters([Konva.Filters.Brighten, Konva.Filters.Contrast, Konva.Filters.HSL]);
    node.brightness(f.brightness / 100);
    node.contrast(f.contrast);
    node.saturation(f.saturation / 100);
    node.cache();
    node.getLayer()?.batchDraw();
  }, [image, f.brightness, f.contrast, f.saturation, zoom, slide.rotation, w, h, factor]);

  return (
    <Group clipFunc={(ctx) => ctx.rect(0, 0, w, h)}>
      <KonvaImage
        ref={ref}
        image={image}
        x={w / 2}
        y={h / 2}
        offsetX={dw / 2}
        offsetY={dh / 2}
        width={dw}
        height={dh}
        rotation={slide.rotation ?? 0}
        listening={false}
      />
    </Group>
  );
}

export interface SlideCanvasProps {
  slide: SlideObject;
  ratio: Ratio;
  assetUrls: Record<string, string>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onPatchLayer: (id: string, patch: LayerPatch) => void;
  fitMode?: "fill" | "fit";
}

export function KonvaCanvas({
  slide,
  ratio,
  assetUrls,
  selectedId,
  onSelect,
  onPatchLayer,
  fitMode = "fill",
}: SlideCanvasProps) {
  const { w, h } = CANVAS_DIMS[ratio];
  const wrapRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [boxSize, setBoxSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const bg = useHtmlImage(
    slide.background ? assetUrls[slide.background.assetId] ?? slide.background.src ?? null : null,
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const width = el.clientWidth || rect.width;
      const height = el.clientHeight || rect.height;
      if (width > 0 && height > 0) {
        setBoxSize({ w: width, h: height });
      }
    };

    updateSize();
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width > 0 && cr.height > 0) {
          setBoxSize({ w: cr.width, h: cr.height });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale =
    boxSize.w > 0 && boxSize.h > 0
      ? Math.min(boxSize.w / w, boxSize.h / h)
      : boxSize.w > 0
        ? boxSize.w / w
        : 0;

  useEffect(() => {
    const tr = trRef.current;
    const layer = layerRef.current;
    if (!tr || !layer) return;
    const node = selectedId ? layer.findOne(`#${selectedId}`) : null;
    const target = node && node.getClassName() === "Image" ? node : null;
    tr.nodes(target ? [target] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, slide]);

  const stageW = Math.round(w * scale);
  const stageH = Math.round(h * scale);

  return (
    <div ref={wrapRef} className="flex h-full w-full min-h-[220px] items-center justify-center overflow-hidden">
      {scale > 0 && (
        <Stage
          width={stageW}
          height={stageH}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) onSelect(null);
          }}
          onTouchStart={(e) => {
            if (e.target === e.target.getStage()) onSelect(null);
          }}
        >
          <Layer listening={false}>
            <Rect width={w} height={h} fill={slide.background_color ?? "#111318"} />
            {bg && <BackgroundImage image={bg} slide={slide} w={w} h={h} fitMode={fitMode} />}
          </Layer>
          <Layer ref={layerRef}>
            {slide.layers.map((layer) =>
              layer.type === "text" ? (
                <KonvaText
                  key={layer.id}
                  id={layer.id}
                  text={layer.text}
                  x={layer.x}
                  y={layer.y}
                  width={Math.max(40, w - layer.x * 2)}
                  fontSize={layer.fontSize}
                  fontFamily={layer.fontFamily}
                  fill={layer.color}
                  align={layer.align}
                  rotation={layer.rotation ?? 0}
                  fontStyle={layer.fontStyle ?? "normal"}
                  shadowEnabled={layer.shadow}
                  shadowColor="#000000"
                  shadowBlur={layer.shadow ? 8 : 0}
                  shadowOpacity={0.5}
                  draggable
                  onClick={() => onSelect(layer.id)}
                  onTap={() => onSelect(layer.id)}
                  onDragEnd={(e) => onPatchLayer(layer.id, { x: e.target.x(), y: e.target.y() })}
                />
              ) : (
                <LayerImage
                  key={layer.id}
                  layer={layer}
                  url={layer.assetId ? assetUrls[layer.assetId] ?? layer.src ?? null : layer.src}
                  onSelect={onSelect}
                  onPatchLayer={onPatchLayer}
                />
              ),
            )}
            <Transformer
              ref={trRef}
              rotateEnabled={false}
              keepRatio
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 24 || newBox.height < 24 ? oldBox : newBox)}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}

function LayerImage({
  layer,
  url,
  onSelect,
  onPatchLayer,
}: {
  layer: Extract<CanvasLayer, { type: "image" }>;
  url: string | null | undefined;
  onSelect: (id: string | null) => void;
  onPatchLayer: (id: string, patch: LayerPatch) => void;
}) {
  const image = useHtmlImage(url ?? null);
  if (!image) {
    return (
      <Rect
        id={layer.id}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        fill="rgba(120,120,140,0.25)"
        stroke="#888"
        dash={[6, 6]}
        draggable
        onClick={() => onSelect(layer.id)}
        onDragEnd={(e) => onPatchLayer(layer.id, { x: e.target.x(), y: e.target.y() })}
      />
    );
  }
  return (
    <KonvaImage
      id={layer.id}
      image={image}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      opacity={layer.opacity ?? 1}
      rotation={layer.rotation ?? 0}
      draggable
      onClick={() => onSelect(layer.id)}
      onTap={() => onSelect(layer.id)}
      onDragEnd={(e) => onPatchLayer(layer.id, { x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target as Konva.Image;
        onPatchLayer(layer.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(24, node.width() * node.scaleX()),
          height: Math.max(24, node.height() * node.scaleY()),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    />
  );
}
