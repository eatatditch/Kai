"use client";

import { useEffect, useMemo, useState } from "react";
import type { Note, NoteCategory, NoteFilterKey } from "@/types";
import { NOTE_CATEGORIES, getNoteCategory } from "@/lib/note-categories";
import {
  fetchNotes,
  upsertNote,
  deleteNoteById,
  subscribeNotes,
} from "@/lib/notes-api";
import { NoteModal } from "./NoteModal";

type Props = {
  showToast: (msg: string) => void;
};

type ModalState = { editId: string | null } | null;

export function NotesPanel({ showToast }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<NoteFilterKey>("all");
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    let active = true;
    fetchNotes()
      .then((rows) => {
        if (active) setNotes(rows);
      })
      .catch(() => {
        if (active) showToast("Failed to load notes");
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    return subscribeNotes((change) => {
      if (change.kind === "upsert") {
        const incoming = change.note;
        setNotes((prev) => {
          const idx = prev.findIndex((n) => n.id === incoming.id);
          if (idx === -1)
            return [incoming, ...prev].sort((a, b) =>
              b.updatedAt.localeCompare(a.updatedAt),
            );
          const next = prev.slice();
          next[idx] = incoming;
          return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });
      } else {
        setNotes((prev) => prev.filter((n) => n.id !== change.id));
      }
    });
  }, []);

  const visible = useMemo(() => {
    if (filter === "all") return notes;
    return notes.filter((n) => n.category === filter);
  }, [notes, filter]);

  const editing =
    modal && modal.editId
      ? notes.find((n) => n.id === modal.editId) ?? null
      : null;

  const onSave = (note: Note) => {
    const isUpdate = notes.some((n) => n.id === note.id);
    const snapshot = notes;
    setNotes((prev) => {
      const next = isUpdate
        ? prev.map((n) => (n.id === note.id ? note : n))
        : [note, ...prev];
      return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
    setModal(null);

    upsertNote(note)
      .then((saved) => {
        setNotes((prev) =>
          prev
            .map((n) => (n.id === saved.id ? saved : n))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        );
        showToast(isUpdate ? "Note updated" : "Note saved");
      })
      .catch(() => {
        setNotes(snapshot);
        showToast("Save failed — changes rolled back");
      });
  };

  const onDelete = (id: string) => {
    const snapshot = notes;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setModal(null);

    deleteNoteById(id)
      .then(() => showToast("Note deleted"))
      .catch(() => {
        setNotes(snapshot);
        showToast("Delete failed — restored");
      });
  };

  return (
    <aside className="overflow-hidden rounded-[10px] border-[1.5px] border-ink bg-white shadow-card print:hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
        <h2 className="m-0 font-bebas text-[18px] tracking-[0.1em] text-navy">
          NOTES &amp; IDEAS
        </h2>
        <button
          type="button"
          onClick={() => setModal({ editId: null })}
          className="inline-flex items-center gap-1 rounded-sm border-[1.5px] border-orange bg-orange px-2.5 py-1 text-[12px] font-semibold text-white transition-colors duration-150 hover:border-[#b8541f] hover:bg-[#b8541f]"
        >
          <span className="leading-none">＋</span> New
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-line-soft bg-cream/40 px-3 py-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full border-[1.5px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all ${
            filter === "all"
              ? "border-orange bg-orange text-white"
              : "border-line bg-white text-muted hover:border-navy"
          }`}
        >
          All
        </button>
        {NOTE_CATEGORIES.map((c) => {
          const on = filter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              title={c.label}
              className={`flex items-center gap-1 rounded-full border-[1.5px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] transition-all ${
                on
                  ? "border-navy bg-navy text-white"
                  : "border-line bg-white text-muted hover:border-navy"
              }`}
            >
              <span>{c.emoji}</span>
              <span>{c.label.replace(" Ideas", "").replace(" Notes", "")}</span>
            </button>
          );
        })}
      </div>

      <div className="max-h-[680px] overflow-y-auto px-3 py-3">
        {visible.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <p className="m-0 font-bebas text-[14px] tracking-[0.08em] text-muted">
              {filter === "all"
                ? "NO NOTES YET"
                : "NOTHING IN THIS CATEGORY"}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Click <span className="font-semibold text-orange">New</span> to
              capture a thought.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((note) => {
              const cat = getNoteCategory(note.category);
              return (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => setModal({ editId: note.id })}
                    className="group flex w-full flex-col rounded-[6px] border border-line bg-white p-2.5 text-left transition-all duration-150 hover:-translate-y-px hover:border-ink"
                    style={{
                      borderLeftColor: cat.color,
                      borderLeftWidth: 3,
                    }}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-[12px] leading-none">
                        {cat.emoji}
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: cat.color }}
                      >
                        {cat.label}
                      </span>
                    </div>
                    <h3 className="m-0 line-clamp-2 font-dm text-[13px] font-semibold leading-snug text-ink group-hover:text-orange">
                      {note.title}
                    </h3>
                    {note.body && (
                      <p className="m-0 mt-1 line-clamp-2 text-[11px] leading-[1.4] text-muted">
                        {note.body}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modal && (
        <NoteModal
          key={modal.editId ?? "new"}
          initialNote={editing}
          defaultCategory={
            (filter !== "all" ? filter : "general") as NoteCategory
          }
          onClose={() => setModal(null)}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </aside>
  );
}
