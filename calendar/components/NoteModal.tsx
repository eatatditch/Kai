"use client";

import { useEffect, useRef, useState } from "react";
import type { Note, NoteCategory } from "@/types";
import { NOTE_CATEGORIES } from "@/lib/note-categories";

type Props = {
  initialNote: Note | null;
  defaultCategory: NoteCategory;
  onClose: () => void;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
};

function uid(): string {
  return crypto.randomUUID();
}

export function NoteModal({
  initialNote,
  defaultCategory,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [category, setCategory] = useState<NoteCategory>(
    initialNote?.category ?? defaultCategory,
  );
  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [body, setBody] = useState(initialNote?.body ?? "");

  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isEdit = initialNote !== null;

  const handleSave = () => {
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    onSave({
      id: initialNote?.id ?? uid(),
      category,
      title: title.trim(),
      body: body.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = () => {
    if (!initialNote) return;
    if (!confirm(`Delete "${initialNote.title}"?`)) return;
    onDelete(initialNote.id);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(31,42,48,0.6)] p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="motion-safe:animate-pop max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[10px] border-2 border-ink bg-cream shadow-pop"
      >
        <div className="flex items-center justify-between border-b-[1.5px] border-ink bg-navy px-5 py-4 text-cream">
          <h3 className="m-0 font-bebas text-[22px] tracking-[0.04em]">
            {isEdit ? "EDIT NOTE" : "NEW NOTE"}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border-[1.5px] border-cream bg-transparent text-base leading-none text-cream hover:border-orange hover:bg-orange"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="mb-3.5">
            <label
              htmlFor="note-category"
              className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
            >
              Category
            </label>
            <select
              id="note-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as NoteCategory)}
              className="w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
            >
              {NOTE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji}  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3.5">
            <label
              htmlFor="note-title"
              className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
            >
              Title
            </label>
            <input
              ref={titleRef}
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Sunset shoot at the pier"
              className="w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
            />
          </div>

          <div className="mb-3.5">
            <label
              htmlFor="note-body"
              className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
            >
              Details
            </label>
            <textarea
              id="note-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Vibe, location, references, action items, links…"
              className="min-h-[160px] w-full resize-y rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1.5">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-sm border-[1.5px] border-line bg-white px-4 py-2 text-[13px] font-semibold text-muted transition-colors duration-150 hover:border-cat-event hover:bg-[#f3d5cc] hover:text-[#8a2c10]"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm border-[1.5px] border-ink bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors duration-150 hover:bg-sand"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-sm border-[1.5px] border-orange bg-orange px-4 py-2 text-[13px] font-semibold text-white transition-colors duration-150 hover:border-[#b8541f] hover:bg-[#b8541f]"
              >
                {isEdit ? "Update Note" : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
