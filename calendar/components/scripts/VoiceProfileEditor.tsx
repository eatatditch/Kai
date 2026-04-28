"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../AppShell";
import { Toast } from "../Toast";
import { ProfileFields } from "./ProfileFields";
import { ReferenceList } from "./ReferenceList";
import {
  EMPTY_PROFILE,
  SCRIPT_BRANDS,
  type ReferenceScript,
  type ScriptBrand,
  type VoiceProfile,
  type VoiceProfileJson,
} from "@/lib/scripts/types";
import {
  deleteReferenceScript,
  fetchVoiceProfile,
  insertReferenceScripts,
  updateReferenceScript,
  upsertVoiceProfile,
} from "@/lib/scripts/api";

const labelCls =
  "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted";
const inputCls =
  "w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15";

const LOADING_MESSAGES = [
  "Reading your scripts.",
  "Counting how often you say \"honestly.\"",
  "Looking for the joke under the joke.",
  "Profile incoming.",
];

type Props = {
  userEmail: string;
  isAdmin: boolean;
  mode: "new" | "edit";
  profileId?: string;
};

type DraftReference = {
  key: string;
  id?: string; // existing reference id when loaded from db
  title: string;
  content: string;
  source_format: ReferenceScript["source_format"];
};

function uid(): string {
  return crypto.randomUUID();
}

export function VoiceProfileEditor({
  userEmail,
  isAdmin,
  mode,
  profileId,
}: Props) {
  const router = useRouter();
  const isNew = mode === "new";

  const [name, setName] = useState("");
  const [brand, setBrand] = useState<ScriptBrand | "">("");
  const [profileJson, setProfileJson] = useState<VoiceProfileJson | null>(
    isNew ? null : null,
  );
  const [profileMeta, setProfileMeta] = useState<VoiceProfile | null>(null);

  const [refs, setRefs] = useState<DraftReference[]>([
    { key: uid(), title: "", content: "", source_format: "paste" },
    { key: uid(), title: "", content: "", source_format: "paste" },
  ]);

  const [loadingPage, setLoadingPage] = useState(!isNew);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (isNew || !profileId) return;
    let active = true;
    fetchVoiceProfile(profileId)
      .then((res) => {
        if (!active) return;
        if (!res) {
          setError("Profile not found");
          setLoadingPage(false);
          return;
        }
        setProfileMeta(res.profile);
        setName(res.profile.name);
        setBrand((res.profile.brand as ScriptBrand) ?? "");
        setProfileJson(res.profile.profile_json);
        setRefs(
          res.references.map((r) => ({
            key: r.id,
            id: r.id,
            title: r.title,
            content: r.content,
            source_format: r.source_format,
          })),
        );
        setLoadingPage(false);
      })
      .catch(() => {
        if (active) {
          setError("Failed to load profile");
          setLoadingPage(false);
        }
      });
    return () => {
      active = false;
    };
  }, [isNew, profileId]);

  const onAddPasteRef = () =>
    setRefs((prev) => [
      ...prev,
      { key: uid(), title: "", content: "", source_format: "paste" },
    ]);

  const onUpdateRef = (key: string, patch: Partial<DraftReference>) =>
    setRefs((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const onRemoveRef = async (key: string) => {
    const target = refs.find((r) => r.key === key);
    if (target?.id) {
      try {
        await deleteReferenceScript(target.id);
        showToast("Reference removed");
      } catch {
        showToast("Remove failed");
        return;
      }
    }
    setRefs((prev) => prev.filter((r) => r.key !== key));
  };

  const onUploadFile = async (key: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/scripts/voices/parse", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Upload failed");
        return;
      }
      const parsed = (await res.json()) as {
        title: string;
        source_format: DraftReference["source_format"];
        content: string;
      };
      onUpdateRef(key, parsed);
    } catch {
      showToast("Upload failed");
    }
  };

  const validRefs = refs
    .map((r) => ({ ...r, content: r.content.trim(), title: r.title.trim() }))
    .filter((r) => r.content.length > 0);

  const onExtract = async () => {
    if (validRefs.length < 1) {
      showToast("Add at least one reference script first.");
      return;
    }
    if (!name.trim()) {
      showToast("Give the profile a name first.");
      return;
    }
    setExtracting(true);
    setError(null);
    try {
      const res = await fetch("/api/scripts/voices/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scripts: validRefs.map((r) => ({
            title: r.title || "Untitled",
            content: r.content,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Extraction failed");
        showToast("Extraction failed");
        return;
      }
      setProfileJson(data.profile as VoiceProfileJson);
      showToast("Voice profile extracted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed");
      showToast("Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const onSave = async () => {
    if (!name.trim()) {
      showToast("Name is required.");
      return;
    }
    if (validRefs.length < 1) {
      showToast("Add at least one reference script first.");
      return;
    }
    setSaving(true);
    try {
      const saved = await upsertVoiceProfile({
        id: profileMeta?.id,
        name: name.trim(),
        brand: brand || null,
        profile_json: profileJson ?? EMPTY_PROFILE,
      });

      const newRefs = validRefs.filter((r) => !r.id);
      const existingRefs = validRefs.filter((r) => r.id);
      if (newRefs.length > 0) {
        await insertReferenceScripts(
          saved.id,
          newRefs.map((r) => ({
            title: r.title || "Untitled",
            source_format: r.source_format,
            content: r.content,
          })),
        );
      }
      await Promise.all(
        existingRefs.map((r) =>
          updateReferenceScript(r.id!, {
            title: r.title || "Untitled",
            content: r.content,
          }),
        ),
      );
      showToast(isNew ? "Profile saved" : "Profile updated");
      if (isNew) {
        router.push(`/scripts/voices/${saved.id}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setError(msg);
      showToast("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const title = isNew ? "New Voice Profile" : profileMeta?.name || "Voice Profile";

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-6 pb-15">
      <AppShell
        userEmail={userEmail}
        isAdmin={isAdmin}
        current="scripts"
        homeHref="/scripts"
        title={title}
        subtitle="Reference scripts in. Voice profile out."
        printHidden
        actions={
          <Link
            href="/scripts/voices"
            className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-ink bg-white px-3.5 py-2.5 font-dm text-[13px] font-semibold text-ink shadow-card transition-colors duration-150 hover:bg-sand"
          >
            ← All voices
          </Link>
        }
      />

      {loadingPage ? (
        <p className="text-[14px] text-muted">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-[10px] border-[1.5px] border-line bg-white p-5 shadow-card">
            <h2 className="mb-4 font-bebas text-[20px] tracking-[0.1em] text-navy">
              REFERENCE SCRIPTS
            </h2>
            <ReferenceList
              references={refs}
              onUpdate={onUpdateRef}
              onRemove={onRemoveRef}
              onUploadFile={onUploadFile}
              onAddPaste={onAddPasteRef}
            />
          </section>

          <section className="flex flex-col gap-5">
            <div className="rounded-[10px] border-[1.5px] border-line bg-white p-5 shadow-card">
              <h2 className="mb-4 font-bebas text-[20px] tracking-[0.1em] text-navy">
                PROFILE
              </h2>

              <div className="mb-3.5">
                <label htmlFor="profile-name" className={labelCls}>
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ditch House Voice"
                  className={inputCls}
                />
              </div>

              <div className="mb-3.5">
                <label htmlFor="profile-brand" className={labelCls}>
                  Brand
                </label>
                <select
                  id="profile-brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value as ScriptBrand | "")}
                  className={inputCls}
                >
                  <option value="">— Choose —</option>
                  {SCRIPT_BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onExtract}
                  disabled={extracting || validRefs.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-orange bg-orange px-3.5 py-2.5 font-bebas text-[15px] uppercase tracking-[0.1em] text-white shadow-card transition-colors duration-150 hover:border-[#b8541f] hover:bg-[#b8541f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {extracting
                    ? "Extracting…"
                    : profileJson
                      ? "Re-extract"
                      : "Extract Voice Profile"}
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-ink bg-white px-3.5 py-2.5 font-dm text-[13px] font-semibold text-ink shadow-card transition-colors duration-150 hover:bg-sand disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save profile"}
                </button>
              </div>

              {extracting && (
                <ul className="mt-3 rounded-sm border border-line bg-cream px-3 py-2 text-[12px] text-muted">
                  {LOADING_MESSAGES.map((m) => (
                    <li
                      key={m}
                      className="border-b border-dashed border-line py-0.5 last:border-b-0"
                    >
                      {m}
                    </li>
                  ))}
                </ul>
              )}
              {error && (
                <p className="mt-2 text-[12px] text-[var(--cat-event)]">
                  {error}
                </p>
              )}
            </div>

            {profileJson && (
              <ProfileFields
                value={profileJson}
                onChange={setProfileJson}
              />
            )}
          </section>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}
