"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClientError, patch } from "@/lib/client";
import type { EditorState } from "@/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";

const HISTORY_LIMIT = 50;
const AUTOSAVE_MS = 5000;

export interface EditorController {
  state: EditorState;
  setState: (next: EditorState | ((s: EditorState) => EditorState), opts?: { record?: boolean }) => void;
  begin: () => void;
  end: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  status: SaveStatus;
  save: () => Promise<void>;
  reset: (next: EditorState, updatedAt: string) => void;
}

/** Editor state with history (undo/redo) and 5s debounced autosave (FR-ED-1). */
export function useEditorState(
  creationId: string,
  initial: EditorState,
  initialUpdatedAt: string,
): EditorController {
  const [state, setStateRaw] = useState<EditorState>(initial);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [counts, setCounts] = useState({ past: 0, future: 0 });

  const stateRef = useRef<EditorState>(initial);
  const updatedAtRef = useRef(initialUpdatedAt);
  const pastRef = useRef<EditorState[]>([]);
  const futureRef = useRef<EditorState[]>([]);
  const txBaseRef = useRef<EditorState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = (prev: EditorState, future: EditorState[]) => {
    pastRef.current = [...pastRef.current, prev].slice(-HISTORY_LIMIT);
    futureRef.current = future;
    setCounts({ past: pastRef.current.length, future: futureRef.current.length });
  };

  const save = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setStatus("saving");
    try {
      const res = await patch<{ updatedAt: string }>(`/api/creations/${creationId}/editor-state`, {
        editorState: stateRef.current,
        expectedUpdatedAt: updatedAtRef.current,
      });
      updatedAtRef.current = res.updatedAt;
      setStatus("saved");
    } catch (e) {
      setStatus(e instanceof ClientError && e.status === 409 ? "conflict" : "error");
    }
  }, [creationId]);

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void save(), AUTOSAVE_MS);
  }, [save]);

  const setState = useCallback<EditorController["setState"]>(
    (next, opts) => {
      const record = opts?.record ?? true;
      const cur = stateRef.current;
      const value = typeof next === "function" ? next(cur) : next;
      if (value === cur) return;
      if (record && !txBaseRef.current) commit(cur, []);
      stateRef.current = value;
      setStateRaw(value);
      setStatus((s) => (s === "conflict" ? s : "idle"));
      schedule();
    },
    [schedule],
  );

  const begin = useCallback(() => {
    txBaseRef.current = stateRef.current;
  }, []);

  const end = useCallback(() => {
    const base = txBaseRef.current;
    txBaseRef.current = null;
    if (base && base !== stateRef.current) commit(base, []);
  }, []);

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (!past.length) return;
    const prev = past[past.length - 1];
    const future = [stateRef.current, ...futureRef.current].slice(0, HISTORY_LIMIT);
    pastRef.current = past.slice(0, -1);
    futureRef.current = future;
    stateRef.current = prev;
    setStateRaw(prev);
    setCounts({ past: pastRef.current.length, future: future.length });
    schedule();
  }, [schedule]);

  const redo = useCallback(() => {
    const future = futureRef.current;
    if (!future.length) return;
    const next = future[0];
    const past = [...pastRef.current, stateRef.current].slice(-HISTORY_LIMIT);
    pastRef.current = past;
    futureRef.current = future.slice(1);
    stateRef.current = next;
    setStateRaw(next);
    setCounts({ past: past.length, future: futureRef.current.length });
    schedule();
  }, [schedule]);

  const reset = useCallback((next: EditorState, updatedAt: string) => {
    pastRef.current = [];
    futureRef.current = [];
    txBaseRef.current = null;
    stateRef.current = next;
    updatedAtRef.current = updatedAt;
    setStateRaw(next);
    setCounts({ past: 0, future: 0 });
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    state,
    setState,
    begin,
    end,
    undo,
    redo,
    canUndo: counts.past > 0,
    canRedo: counts.future > 0,
    status,
    save,
    reset,
  };
}
