"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "../AppShell";
import { Toast } from "../Toast";
import { ScriptsTabsNav } from "./ScriptsTabsNav";
import {
  deleteVoiceProfile,
  fetchVoiceProfiles,
} from "@/lib/scripts/api";
import type { VoiceProfileSummary } from "@/lib/scripts/types";

type Props = {
  userEmail: string;
  isAdmin: boolean;
};

export function VoicesIndex({ userEmail, isAdmin }: Props) {
  const [profiles, setProfiles] = useState<VoiceProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const reload = useCallback(() => {
    let active = true;
    fetchVoiceProfiles()
      .then((rows) => {
        if (active) {
          setProfiles(rows);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          showToast("Failed to load profiles");
        }
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => reload(), [reload]);

  const onDelete = async (p: VoiceProfileSummary) => {
    if (!confirm(`Delete "${p.name}" and its references?`)) return;
    try {
      await deleteVoiceProfile(p.id);
      setProfiles((prev) => prev.filter((x) => x.id !== p.id));
      showToast("Profile deleted");
    } catch {
      showToast("Delete failed");
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-6 pb-15">
      <AppShell
        userEmail={userEmail}
        isAdmin={isAdmin}
        current="scripts"
        homeHref="/scripts"
        title="Voice Profiles"
        subtitle="Train the generator on your existing scripts"
        printHidden
        actions={
          <Link
            href="/scripts/voices/new"
            className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-orange bg-orange px-3.5 py-2.5 font-dm text-[13px] font-semibold text-white shadow-card transition-colors duration-150 hover:border-[#b8541f] hover:bg-[#b8541f]"
          >
            <span className="text-sm leading-none">＋</span> New Voice
          </Link>
        }
      />
      <ScriptsTabsNav active="voices" />

      {loading ? (
        <p className="text-[14px] text-muted">Loading…</p>
      ) : profiles.length === 0 ? (
        <div className="rounded-[10px] border-[1.5px] border-line bg-white px-6 py-12 text-center shadow-card">
          <p className="m-0 font-bebas text-[20px] tracking-[0.08em] text-muted">
            NO VOICE PROFILES YET
          </p>
          <p className="mt-2 text-[13px] text-muted">
            Click{" "}
            <span className="font-semibold text-orange">+ New Voice</span> and
            paste in 2–5 scripts to teach the generator your voice.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <li key={p.id}>
              <article className="group flex h-full flex-col rounded-[10px] border-[1.5px] border-line bg-white p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-ink">
                <div className="mb-2 flex items-center gap-2">
                  {p.brand && (
                    <span className="rounded-full border border-line bg-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-navy">
                      {p.brand}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {p.reference_count} reference
                    {p.reference_count === 1 ? "" : "s"}
                  </span>
                </div>
                <h3 className="m-0 mb-1 font-bebas text-[22px] leading-tight tracking-[0.04em] text-navy group-hover:text-orange">
                  {p.name}
                </h3>
                {p.profile_json?.voice_summary && (
                  <p className="m-0 mb-3 line-clamp-3 text-[12.5px] leading-[1.5] text-muted">
                    {p.profile_json.voice_summary}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap gap-2 pt-2 text-[12px]">
                  <Link
                    href={`/scripts?profile=${p.id}`}
                    className="rounded-sm border border-line bg-white px-2 py-1 font-semibold text-ink transition-colors duration-150 hover:bg-sand"
                  >
                    Use
                  </Link>
                  <Link
                    href={`/scripts/voices/${p.id}`}
                    className="rounded-sm border border-line bg-white px-2 py-1 font-semibold text-ink transition-colors duration-150 hover:bg-sand"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(p)}
                    className="rounded-sm border border-line bg-white px-2 py-1 font-semibold text-muted transition-colors duration-150 hover:border-[var(--cat-event)] hover:text-[var(--cat-event)]"
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">
                  Updated{" "}
                  {new Date(p.updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}
