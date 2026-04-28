"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../AppShell";
import { Toast } from "../Toast";
import { ScriptsTabsNav } from "./ScriptsTabsNav";
import { consumeBlockStream } from "./streamClient";
import { fetchVoiceProfiles } from "@/lib/scripts/api";
import { saveGeneratedCaptions } from "@/lib/scripts/companion-api";
import {
  CAPTIONS_DELIMITER,
  CAPTIONS_PLATFORMS,
  HASHTAG_COUNTS,
  type CaptionsBrief,
  type CaptionsPlatform,
  type CaptionVariant,
} from "@/lib/scripts/companion-types";
import { SCRIPT_BRANDS, type ScriptBrand, type VoiceProfileSummary } from "@/lib/scripts/types";
import type { ParserSpec } from "@/lib/scripts/blockStreamParser";

const SPEC: ParserSpec = {
  delimiter: CAPTIONS_DELIMITER,
  fields: [
    { label: "NAME", multiline: false, kind: "string" },
    { label: "ANGLE", multiline: false, kind: "string" },
    { label: "CAPTION", multiline: true, kind: "string" },
    { label: "HASHTAGS", multiline: false, kind: "string" },
  ],
};

const labelCls =
  "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted";
const inputCls =
  "w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15";

type Props = {
  userEmail: string;
  isAdmin: boolean;
};

function fromBlock(values: Record<string, string | number>): CaptionVariant {
  return {
    name: String(values.NAME ?? ""),
    angle: String(values.ANGLE ?? ""),
    caption: String(values.CAPTION ?? ""),
    hashtags: String(values.HASHTAGS ?? ""),
  };
}

export function CaptionsGenerator({ userEmail, isAdmin }: Props) {
  const search = useSearchParams();
  const initialProfileId = search?.get("profile") ?? "";
  const initialEventId = search?.get("eventId") ?? "";
  const initialTopic = search?.get("topic") ?? "";
  const initialFacts = search?.get("facts") ?? "";
  const initialFromScriptId = search?.get("fromScriptId") ?? "";

  const [profiles, setProfiles] = useState<VoiceProfileSummary[]>([]);
  const [profileId, setProfileId] = useState(initialProfileId);
  const [eventId] = useState(initialEventId);
  const [fromScriptId] = useState(initialFromScriptId);
  const [brand, setBrand] = useState<ScriptBrand>("Ditch");
  const [brandOther, setBrandOther] = useState("");
  const [topic, setTopic] = useState(initialTopic);
  const [facts, setFacts] = useState(initialFacts);
  const [cta, setCta] = useState("");
  const [platform, setPlatform] = useState<CaptionsPlatform>("Instagram");
  const [hashtagCount, setHashtagCount] = useState<0 | 3 | 5>(3);
  const [spice, setSpice] = useState<1 | 2 | 3 | 4 | 5>(3);

  const [variants, setVariants] = useState<CaptionVariant[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<Set<number>>(new Set());
  const [slotsStreaming, setSlotsStreaming] = useState<
    Map<number, CaptionVariant>
  >(new Map());
  const [streaming, setStreaming] = useState(false);
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
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const buildBrief = (): CaptionsBrief => {
    const resolvedBrand =
      brand === "Other" && brandOther.trim() ? "Other" : brand;
    return {
      profile_id: profileId || null,
      event_id: eventId || null,
      source_script_id: fromScriptId || null,
      brand: resolvedBrand,
      brand_other: resolvedBrand === "Other" ? brandOther.trim() : undefined,
      topic: topic.trim(),
      facts: facts.trim(),
      cta: cta.trim(),
      platform,
      hashtag_count: hashtagCount,
      spice,
    };
  };

  const onGenerate = async () => {
    if (!topic.trim() || !facts.trim()) {
      showToast("Fill in topic and key facts first.");
      return;
    }
    setVariants([]);
    setSlotsLoading(new Set([0, 1, 2]));
    setSlotsStreaming(new Map());
    setError(null);
    setStreaming(true);
    try {
      const final = await consumeBlockStream(
        "/api/scripts/captions",
        buildBrief(),
        SPEC,
        (blocks, inProgress) => {
          setVariants(blocks.map((b) => fromBlock(b.values)));
          setSlotsStreaming(
            inProgress
              ? new Map([[blocks.length, fromBlock(inProgress.values)]])
              : new Map(),
          );
        },
      );
      setVariants(final.slice(0, 3).map((b) => fromBlock(b.values)));
      setSlotsStreaming(new Map());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      showToast("Generation failed");
    } finally {
      setSlotsLoading(new Set());
      setStreaming(false);
    }
  };

  const onCopy = async (idx: number) => {
    const v = variants[idx];
    if (!v) return;
    const text = v.hashtags ? `${v.caption}\n\n${v.hashtags}` : v.caption;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied");
    } catch {
      showToast("Copy failed");
    }
  };

  const onSaveAll = async () => {
    if (variants.length === 0) return;
    const brief = buildBrief();
    try {
      await saveGeneratedCaptions({
        event_id: brief.event_id,
        profile_id: brief.profile_id,
        source_script_id: brief.source_script_id,
        brand: brief.brand,
        topic: brief.topic,
        brief_json: brief,
        variants_json: variants,
      });
      showToast(eventId ? "Saved + attached to event" : "Saved");
    } catch {
      showToast("Save failed");
    }
  };

  const showCards =
    variants.length > 0 || slotsLoading.size > 0 || slotsStreaming.size > 0;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-6 pb-15">
      <AppShell
        userEmail={userEmail}
        isAdmin={isAdmin}
        current="scripts"
        homeHref="/scripts"
        title="Captions"
        subtitle="IG / TikTok captions in the house voice"
        printHidden
      />
      <ScriptsTabsNav active="captions" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="rounded-[10px] border-[1.5px] border-line bg-white p-5 shadow-card">
          <h2 className="mb-4 font-bebas text-[20px] tracking-[0.1em] text-navy">
            BRIEF
          </h2>

          {(eventId || fromScriptId) && (
            <div className="mb-4 rounded-sm border border-navy bg-navy-tint px-3 py-2 text-[12px] text-ink">
              <div className="font-semibold text-navy">
                {fromScriptId ? "Deriving from a saved script" : "Linked to an event"}
              </div>
              <div className="text-muted">
                {fromScriptId
                  ? "Output will match the source script's tone and beats."
                  : "Saving these captions will attach them to that event."}
              </div>
            </div>
          )}

          <div className="mb-3.5">
            <label className={labelCls}>Voice Profile</label>
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className={inputCls}
            >
              <option value="">Generic dry voice</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3.5">
            <label className={labelCls}>Brand</label>
            <select
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
            <label className={labelCls}>Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Margarita MasterClass May 18"
              className={inputCls}
            />
          </div>

          <div className="mb-3.5">
            <span className={labelCls}>Platform</span>
            <div className="flex gap-2">
              {CAPTIONS_PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`rounded-full border-[1.5px] px-3 py-[5px] text-xs font-medium transition-all duration-150 ${
                    platform === p
                      ? "border-navy bg-navy text-white"
                      : "border-line bg-cream text-ink hover:border-navy"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3.5">
            <span className={labelCls}>Hashtags</span>
            <div className="flex gap-2">
              {HASHTAG_COUNTS.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setHashtagCount(h.value)}
                  className={`rounded-full border-[1.5px] px-3 py-[5px] text-xs font-medium transition-all duration-150 ${
                    hashtagCount === h.value
                      ? "border-navy bg-navy text-white"
                      : "border-line bg-cream text-ink hover:border-navy"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3.5">
            <label className={labelCls}>Key Facts</label>
            <textarea
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              rows={5}
              className={`${inputCls} min-h-[110px] resize-y font-dm`}
            />
          </div>

          <div className="mb-3.5">
            <label className={labelCls}>CTA</label>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Tickets at eatatditch.com"
              className={inputCls}
            />
          </div>

          <div className="mb-4">
            <label className={labelCls}>
              Spice <span className="text-muted">({spice}/5)</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={spice}
              onChange={(e) => setSpice(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
              className="w-full accent-[var(--orange)]"
            />
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={streaming}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-orange bg-orange px-4 py-3 font-bebas text-[18px] uppercase tracking-[0.12em] text-white shadow-card transition-colors duration-150 hover:border-[#b8541f] hover:bg-[#b8541f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {streaming ? "Generating…" : "Generate Captions"}
          </button>
          {error && (
            <p className="mt-2 text-[12px] text-[var(--cat-event)]">{error}</p>
          )}
        </section>

        <section className="flex flex-col gap-4">
          {!showCards && (
            <div className="rounded-[10px] border-[1.5px] border-dashed border-line bg-white px-6 py-12 text-center">
              <p className="m-0 font-bebas text-[20px] tracking-[0.08em] text-muted">
                THREE CAPTIONS WILL APPEAR HERE
              </p>
            </div>
          )}

          {showCards &&
            [0, 1, 2].map((idx) => {
              const streamingSlot = slotsStreaming.get(idx);
              const finished = variants[idx];
              const isLoading = slotsLoading.has(idx);
              const v = streamingSlot ?? finished;
              const isStream = !!streamingSlot;

              if (!v && !isLoading) return null;
              if (!v) {
                return (
                  <div
                    key={`skel-${idx}`}
                    className="animate-pulse rounded-[10px] border-[1.5px] border-line bg-white p-4 shadow-card"
                  >
                    <div className="mb-2 h-4 w-28 rounded bg-sand" />
                    <div className="h-20 rounded bg-cream" />
                  </div>
                );
              }
              return (
                <article
                  key={`v-${idx}`}
                  className={`rounded-[10px] border-[1.5px] bg-white p-4 shadow-card ${
                    isStream
                      ? "border-orange ring-[3px] ring-orange/15"
                      : "border-line"
                  }`}
                >
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">
                        Variant {idx + 1}
                        {isStream && (
                          <span className="ml-2 text-muted">writing…</span>
                        )}
                      </div>
                      <h3 className="m-0 font-bebas text-[22px] leading-tight tracking-[0.04em] text-navy">
                        {v.name || (isStream ? "…" : "")}
                      </h3>
                      {v.angle && (
                        <p className="m-0 mt-0.5 text-[12px] italic text-muted">
                          {v.angle}
                        </p>
                      )}
                    </div>
                    {!isStream && finished && (
                      <button
                        type="button"
                        onClick={() => onCopy(idx)}
                        className="rounded-sm border border-line bg-white px-2 py-1 text-[11px] font-semibold text-ink hover:bg-sand"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                  <pre className="m-0 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-sm border border-line bg-cream px-3 py-2.5 font-dm text-[13px] leading-[1.55] text-ink">
                    {v.caption}
                    {isStream && v.caption && (
                      <span className="ml-0.5 inline-block h-[14px] w-[7px] animate-pulse bg-ink align-middle" />
                    )}
                  </pre>
                  {v.hashtags && (
                    <p className="m-0 mt-2 text-[12px] font-mono text-muted">
                      {v.hashtags}
                    </p>
                  )}
                </article>
              );
            })}

          {variants.length === 3 && !streaming && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onSaveAll}
                className="rounded-[10px] border-[1.5px] border-ink bg-white px-3.5 py-2.5 font-dm text-[13px] font-semibold text-ink shadow-card hover:bg-sand"
              >
                Save captions
              </button>
            </div>
          )}
        </section>
      </div>

      <Toast message={toastMsg} />
    </div>
  );
}
