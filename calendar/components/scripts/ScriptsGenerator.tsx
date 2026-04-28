"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../AppShell";
import { Toast } from "../Toast";
import {
  REFERENCE_VIBES,
  SCRIPT_BRANDS,
  SCRIPT_LENGTHS,
  SCRIPT_PLATFORMS,
  type ScriptBrand,
  type ScriptBrief,
  type ScriptLength,
  type ScriptPlatform,
  type ScriptVariant,
  type VoiceProfileSummary,
} from "@/lib/scripts/types";
import {
  fetchVoiceProfiles,
  saveGeneratedScript,
} from "@/lib/scripts/api";
import { estimateRuntimeSeconds, variantToCopyText } from "@/lib/scripts/format";
import { VariantCard } from "./VariantCard";

const LOADING_MESSAGES = [
  "Reading your brief.",
  "Counting how often we say \"honestly.\"",
  "Looking for the joke under the joke.",
  "Three variants incoming.",
];

const labelCls =
  "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted";
const inputCls =
  "w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15";

type Props = {
  userEmail: string;
  isAdmin: boolean;
};

type ChipGroupProps<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
};

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: ChipGroupProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o)}
            className={`whitespace-nowrap rounded-full border-[1.5px] px-3 py-[5px] text-xs font-medium transition-all duration-150 ${
              active
                ? "border-navy bg-navy text-white"
                : "border-line bg-cream text-ink hover:border-navy"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function ScriptsGenerator({ userEmail, isAdmin }: Props) {
  const search = useSearchParams();
  const initialProfileId = search?.get("profile") ?? "";
  const [profiles, setProfiles] = useState<VoiceProfileSummary[]>([]);
  const [profileId, setProfileId] = useState<string>(initialProfileId);
  const [brand, setBrand] = useState<ScriptBrand>("Ditch");
  const [brandOther, setBrandOther] = useState("");
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState<ScriptLength>(":30");
  const [platform, setPlatform] = useState<ScriptPlatform>("IG Reel / TikTok");
  const [facts, setFacts] = useState("");
  const [cta, setCta] = useState("");
  const [reference, setReference] = useState<string>("");
  const [spice, setSpice] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [lockin, setLockin] = useState("");

  const [variants, setVariants] = useState<ScriptVariant[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenIndex, setRegenIndex] = useState<number | null>(null);
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
    let active = true;
    fetchVoiceProfiles()
      .then((rows) => {
        if (active) setProfiles(rows);
      })
      .catch(() => {
        if (active) showToast("Failed to load voice profiles");
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === profileId) ?? null,
    [profiles, profileId],
  );

  useEffect(() => {
    if (selectedProfile && selectedProfile.brand) {
      setBrand(selectedProfile.brand);
    }
  }, [selectedProfile]);

  const buildBrief = useCallback(
    (overrides?: Partial<ScriptBrief>): ScriptBrief => {
      const resolvedBrand: ScriptBrand =
        brand === "Other" && brandOther.trim() ? "Other" : brand;
      return {
        profile_id: profileId || null,
        brand: resolvedBrand,
        brand_other: resolvedBrand === "Other" ? brandOther.trim() : undefined,
        topic: topic.trim(),
        length,
        platform,
        facts: facts.trim(),
        cta: cta.trim(),
        reference: profileId ? "" : (reference as ScriptBrief["reference"]),
        spice,
        lockin: lockin.trim() || undefined,
        ...overrides,
      };
    },
    [
      brand,
      brandOther,
      cta,
      facts,
      length,
      lockin,
      platform,
      profileId,
      reference,
      spice,
      topic,
    ],
  );

  const callGenerate = async (
    body: ScriptBrief,
  ): Promise<ScriptVariant[]> => {
    const res = await fetch("/api/scripts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed (${res.status})`);
    }
    const data = (await res.json()) as { variants: ScriptVariant[] };
    if (!data.variants || !Array.isArray(data.variants)) {
      throw new Error("Bad response from generator.");
    }
    return data.variants.map((v) => ({
      ...v,
      runtime_estimate_seconds:
        v.runtime_estimate_seconds || estimateRuntimeSeconds(v.script),
    }));
  };

  const onGenerate = async () => {
    if (!topic.trim() || !facts.trim() || !cta.trim()) {
      showToast("Fill in topic, key facts, and CTA first.");
      return;
    }
    setLoading(true);
    setError(null);
    setRegenIndex(null);
    try {
      const generated = await callGenerate(buildBrief());
      setVariants(generated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      showToast("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const onRegenerate = async (idx: number) => {
    if (!variants) return;
    setRegenIndex(idx);
    setError(null);
    try {
      const avoid = variants
        .filter((_, i) => i !== idx)
        .map((v) => `${v.name}: ${v.angle}`);
      const next = await callGenerate(
        buildBrief({ regenerate_index: idx, avoid_angles: avoid }),
      );
      const replacement = next[0];
      if (!replacement) {
        showToast("No replacement variant returned");
        return;
      }
      setVariants((prev) =>
        prev ? prev.map((v, i) => (i === idx ? replacement : v)) : prev,
      );
      showToast("Variant regenerated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regenerate failed");
      showToast("Regenerate failed");
    } finally {
      setRegenIndex(null);
    }
  };

  const onUpdateVariant = (idx: number, patch: Partial<ScriptVariant>) => {
    setVariants((prev) =>
      prev ? prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)) : prev,
    );
  };

  const onCopy = async (idx: number) => {
    if (!variants) return;
    try {
      await navigator.clipboard.writeText(variantToCopyText(variants[idx]));
      showToast("Copied clean text");
    } catch {
      showToast("Copy failed");
    }
  };

  const onSaveAll = async () => {
    if (!variants) return;
    const brief = buildBrief();
    try {
      await saveGeneratedScript({
        profile_id: brief.profile_id,
        brand: brief.brand,
        topic: brief.topic,
        length: brief.length,
        brief_json: brief,
        variants_json: variants,
      });
      showToast("Saved to library");
    } catch {
      showToast("Save failed");
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-6 pb-15">
      <AppShell
        userEmail={userEmail}
        isAdmin={isAdmin}
        current="scripts"
        homeHref="/scripts"
        title="Scripts"
        subtitle="Short-form video ad scripts in the house voice"
        printHidden
        actions={
          <>
            <Link
              href="/scripts/voices"
              className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-ink bg-white px-3.5 py-2.5 font-dm text-[13px] font-semibold text-ink shadow-card transition-colors duration-150 hover:bg-sand"
            >
              Voices
            </Link>
            <Link
              href="/scripts/library"
              className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-ink bg-white px-3.5 py-2.5 font-dm text-[13px] font-semibold text-ink shadow-card transition-colors duration-150 hover:bg-sand"
            >
              Library
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section
          aria-label="Brief"
          className="rounded-[10px] border-[1.5px] border-line bg-white p-5 shadow-card"
        >
          <h2 className="mb-4 font-bebas text-[20px] tracking-[0.1em] text-navy">
            BRIEF
          </h2>

          <div className="mb-3.5">
            <label htmlFor="profile" className={labelCls}>
              Voice Profile
            </label>
            <select
              id="profile"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className={inputCls}
            >
              <option value="">Generic dry voice</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.brand ? ` · ${p.brand}` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-muted">
              <Link
                href="/scripts/voices"
                className="underline-offset-2 hover:text-orange hover:underline"
              >
                Manage voice profiles →
              </Link>
            </p>
          </div>

          <div className="mb-3.5">
            <label htmlFor="brand" className={labelCls}>
              Brand
            </label>
            <select
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value as ScriptBrand)}
              className={inputCls}
            >
              {SCRIPT_BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {brand === "Other" && (
              <input
                type="text"
                value={brandOther}
                onChange={(e) => setBrandOther(e.target.value)}
                placeholder="Brand name"
                className={`${inputCls} mt-2`}
              />
            )}
          </div>

          <div className="mb-3.5">
            <label htmlFor="topic" className={labelCls}>
              Topic / Event
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Margarita MasterClass, ticketed, May 18"
              className={inputCls}
            />
          </div>

          <div className="mb-3.5">
            <span className={labelCls}>Length</span>
            <ChipGroup
              options={SCRIPT_LENGTHS}
              value={length}
              onChange={setLength}
              ariaLabel="Length"
            />
          </div>

          <div className="mb-3.5">
            <span className={labelCls}>Platform</span>
            <ChipGroup
              options={SCRIPT_PLATFORMS}
              value={platform}
              onChange={setPlatform}
              ariaLabel="Platform"
            />
          </div>

          <div className="mb-3.5">
            <label htmlFor="facts" className={labelCls}>
              Key Facts (3–7 bullets)
            </label>
            <textarea
              id="facts"
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              rows={5}
              placeholder={"$65 ticket\nMay 18, 6pm, Port Jefferson\nLearn 3 margaritas + small bites\nCarlos behind the bar"}
              className={`${inputCls} min-h-[110px] resize-y font-dm`}
            />
            <p className="mt-1 text-[11px] text-muted">
              Concrete details. Real names, real prices. Specificity beats cleverness.
            </p>
          </div>

          <div className="mb-3.5">
            <label htmlFor="cta" className={labelCls}>
              CTA
            </label>
            <input
              id="cta"
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Tickets at eatatditch.com"
              className={inputCls}
            />
          </div>

          {!profileId && (
            <div className="mb-3.5">
              <label htmlFor="reference" className={labelCls}>
                Reference Vibe (optional)
              </label>
              <select
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className={inputCls}
              >
                <option value="">— None —</option>
                {REFERENCE_VIBES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-3.5">
            <label htmlFor="spice" className={labelCls}>
              Spice Level <span className="text-muted">({spice}/5)</span>
            </label>
            <input
              id="spice"
              type="range"
              min={1}
              max={5}
              step={1}
              value={spice}
              onChange={(e) => setSpice(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
              className="w-full accent-[var(--orange)]"
            />
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
              <span>Dry observational</span>
              <span>Aggressive</span>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="lockin" className={labelCls}>
              Lock-in (optional)
            </label>
            <input
              id="lockin"
              type="text"
              value={lockin}
              onChange={(e) => setLockin(e.target.value)}
              placeholder="A line, joke, or visual that must appear"
              className={inputCls}
            />
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-orange bg-orange px-4 py-3 font-bebas text-[18px] uppercase tracking-[0.12em] text-white shadow-card transition-colors duration-150 hover:border-[#b8541f] hover:bg-[#b8541f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate Three Variants"}
          </button>
          {error && (
            <p className="mt-2 text-[12px] text-[var(--cat-event)]">{error}</p>
          )}
        </section>

        <section aria-label="Variants" className="flex flex-col gap-4">
          {!variants && !loading && (
            <div className="rounded-[10px] border-[1.5px] border-dashed border-line bg-white px-6 py-12 text-center">
              <p className="m-0 font-bebas text-[20px] tracking-[0.08em] text-muted">
                THREE VARIANTS WILL APPEAR HERE
              </p>
              <p className="mt-2 text-[13px] text-muted">
                Fill in the brief on the left, then{" "}
                <span className="font-semibold text-orange">
                  Generate Three Variants
                </span>
                .
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col gap-3">
              <ul className="rounded-[10px] border-[1.5px] border-line bg-white px-5 py-4 text-[13px] text-muted shadow-card">
                {LOADING_MESSAGES.map((m) => (
                  <li
                    key={m}
                    className="border-b border-dashed border-line py-1 last:border-b-0"
                  >
                    {m}
                  </li>
                ))}
              </ul>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-[10px] border-[1.5px] border-line bg-white p-5 shadow-card"
                >
                  <div className="mb-3 h-5 w-32 rounded bg-sand" />
                  <div className="mb-2 h-3 w-full rounded bg-line-soft" />
                  <div className="mb-4 h-3 w-3/4 rounded bg-line-soft" />
                  <div className="h-32 rounded bg-cream" />
                </div>
              ))}
            </div>
          )}

          {variants && !loading && (
            <>
              {variants.map((v, idx) => (
                <VariantCard
                  key={idx}
                  variant={v}
                  index={idx}
                  regenerating={regenIndex === idx}
                  onCopy={() => onCopy(idx)}
                  onRegenerate={() => onRegenerate(idx)}
                  onUpdate={(patch) => onUpdateVariant(idx, patch)}
                />
              ))}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onSaveAll}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-ink bg-white px-3.5 py-2.5 font-dm text-[13px] font-semibold text-ink shadow-card transition-colors duration-150 hover:bg-sand"
                >
                  Save all to library
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <Toast message={toastMsg} />
    </div>
  );
}
