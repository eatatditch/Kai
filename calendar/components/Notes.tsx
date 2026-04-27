"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Note, NoteCategory, NoteFilterKey } from "@/types";
import { NOTE_CATEGORIES, getNoteCategory } from "@/lib/note-categories";
import {
  fetchNotes,
  upsertNote,
  deleteNoteById,
  subscribeNotes,
} from "@/lib/notes-api";
import { NoteModal } from "./NoteModal";
import { Toast } from "./Toast";

type Props = {
  userEmail: string;
  isAdmin: boolean;
};

type ModalState = { editId: string | null } | null;

export function Notes({ userEmail, isAdmin }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<NoteFilterKey>("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

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
    const unsubscribe = subscribeNotes((change) => {
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
          return next.sort((a, b) =>
            b.updatedAt.localeCompare(a.updatedAt),
          );
        });
      } else {
        setNotes((prev) => prev.filter((n) => n.id !== change.id));
      }
    });
    return unsubscribe;
  }, []);

  const visibleNotes = useMemo(() => {
    if (filter === "all") return notes;
    return notes.filter((n) => n.category === filter);
  }, [notes, filter]);

  const editingNote =
    modal && modal.editId
      ? notes.find((n) => n.id === modal.editId) ?? null
      : null;

  const onSaveNote = (note: Note) => {
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

  const onDeleteNote = (id: string) => {
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
    <div className="mx-auto max-w-[1100px] px-5 pt-6 pb-15">
      <div className="mb-2 flex justify-end gap-3 text-[12px] text-muted">
        <span>{userEmail}</span>
        {isAdmin && (
          <>
            <span aria-hidden="true">·</span>
            <Link
              href="/admin"
              className="font-medium text-muted underline-offset-2 hover:text-orange hover:underline"
            >
              Manage users
            </Link>
          </>
        )}
        <span aria-hidden="true">·</span>
        <Link
          href="/"
          className="font-medium text-muted underline-offset-2 hover:text-orange hover:underline"
        >
          Calendar
        </Link>
        <span aria-hidden="true">·</span>
        <Link
          href="/reports"
          className="font-medium text-muted underline-offset-2 hover:text-orange hover:underline"
        >
          Reports
        </Link>
        <span aria-hidden="true">·</span>
        <form action="/auth/signout" method="post" className="inline">
          <button
            type="submit"
            className="cursor-pointer font-medium text-muted underline-offset-2 hover:text-orange hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>

      <header className="mb-[22px] flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
        <div className="flex flex-col">
          <span className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-orange">
            Ditch Hospitality Group
          </span>
          <h1 className="m-0 font-bebas text-[clamp(40px,5vw,60px)] leading-[0.95] tracking-[0.01em] text-navy">
            Notes &amp; Ideas
          </h1>
          <span className="mt-1.5 text-[13px] font-medium text-muted">
            Shoot ideas, event ideas, meeting notes
          </span>
        </div>
        <button
          type="button"
          onClick={() => setModal({ editId: null })}
          className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-orange bg-orange px-3.5 py-2.5 font-dm text-[13px] font-semibold text-white shadow-card transition-colors duration-150 hover:border-[#b8541f] hover:bg-[#b8541f]"
        >
          <span className="text-sm leading-none">＋</span> New Note
        </button>
      </header>

      <div className="mb-[18px] flex flex-wrap items-center gap-2 rounded-[10px] border-[1.5px] border-line bg-white px-3.5 py-3">
        <span className="mr-1 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
          Filter
        </span>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`whitespace-nowrap rounded-full border-[1.5px] px-2.5 py-[5px] text-xs font-medium transition-all duration-150 ${
            filter === "all"
              ? "border-orange bg-orange text-white"
              : "border-line bg-cream text-ink hover:border-navy"
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
              className={`flex items-center whitespace-nowrap rounded-full border-[1.5px] px-2.5 py-[5px] text-xs font-medium transition-all duration-150 ${
                on
                  ? "border-navy bg-navy text-white"
                  : "border-line bg-cream text-ink hover:border-navy"
              }`}
            >
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                style={{ background: c.color }}
              />
              {c.label}
            </button>
          );
        })}
      </div>

      {visibleNotes.length === 0 ? (
        <div className="rounded-[10px] border-[1.5px] border-line bg-white px-6 py-12 text-center shadow-card">
          <p className="m-0 font-bebas text-[20px] tracking-[0.08em] text-muted">
            {filter === "all"
              ? "NO NOTES YET"
              : "NOTHING IN THIS CATEGORY"}
          </p>
          <p className="mt-2 text-[13px] text-muted">
            Click <span className="font-semibold text-orange">New Note</span>{" "}
            to capture a shoot idea, event concept, or meeting takeaway.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {visibleNotes.map((note) => {
            const cat = getNoteCategory(note.category);
            return (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => setModal({ editId: note.id })}
                  className="group flex h-full w-full flex-col rounded-[10px] border-[1.5px] border-line bg-white p-4 text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-ink"
                  style={{ borderLeftColor: cat.color, borderLeftWidth: 4 }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-base leading-none">
                      {cat.emoji}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: cat.color }}
                    >
                      {cat.label}
                    </span>
                  </div>
                  <h3 className="m-0 mb-1.5 line-clamp-2 font-dm text-[16px] font-semibold text-ink group-hover:text-orange">
                    {note.title}
                  </h3>
                  {note.body && (
                    <p className="m-0 line-clamp-4 text-[13px] leading-[1.5] text-muted">
                      {note.body}
                    </p>
                  )}
                  <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Updated{" "}
                    {new Date(note.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-center font-caveat text-base text-muted">
        capture the spark.
      </p>

      {modal && (
        <NoteModal
          key={modal.editId ?? "new"}
          initialNote={editingNote}
          defaultCategory={
            (filter !== "all" ? filter : "general") as NoteCategory
          }
          onClose={() => setModal(null)}
          onSave={onSaveNote}
          onDelete={onDeleteNote}
        />
      )}

      <Toast message={toastMsg} />
    </div>
  );
}
