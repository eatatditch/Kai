"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "../AppShell";
import { Toast } from "../Toast";
import { ScriptsTabsNav } from "./ScriptsTabsNav";
import { consumeBlockStream } from "./streamClient";
import { fetchVoiceProfiles } from "@/lib/scripts/api";
import { saveGeneratedEmail } from "@/lib/scripts/companion-api";
import {
  EMAIL_AUDIENCES,
  EMAIL_DELIMITER,
  type EmailBrief,
  type EmailOutput,
} from "@/lib/scripts/companion-types";
import {
  SCRIPT_BRANDS,
  type ScriptBrand,
  type VoiceProfileSummary,
} from "@/lib/scripts/types";
import type { ParserSpec } from "@/lib/scripts/blockStreamParser";

const SPEC: ParserSpec = {
  delimiter: EMAIL_DELIMITER,
  fields: [
    { label: "SUBJECT", multiline: false, kind: "string" },
    { label: "PREHEADER", multiline: false, kind: "string" },
    { label: "BODY", multiline: true, kind: "string" },
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

function fromBlock(values: Record<string, string | number>): EmailOutput {
  return {
    subject: String(values.SUBJECT ?? ""),
    preheader: String(values.PREHEADER ?? ""),
    body: String(values.BODY ?? ""),
  };
}

export function EmailGenerator({ userEmail, isAdmin }: Props) {
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
  const [ctaUrl, setCtaUrl] = useState("");
  const [audience, setAudience] = useState<EmailBrief["audience"]>("Members");
  const [spice, setSpice] = useState<1 | 2 | 3 | 4 | 5>(3);

  const [output, setOutput] = useState<EmailOutput | null>(null);
  const [streamPreview, setStreamPreview] = useState<EmailOutput | null>(null);
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

  const buildBrief = (): EmailBrief => {
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
      cta_url: ctaUrl.trim() || undefined,
      audience,
      spice,
    };
  };

  const onGenerate = async () => {
    if (!topic.trim() || !facts.trim()) {
      showToast("Fill in topic and key facts first.");
      return;
    }
    setOutput(null);
    setStreamPreview(null);
    setError(null);
    setStreaming(true);
    try {
      const final = await consumeBlockStream(
        "/api/scripts/email",
        buildBrief(),
        SPEC,
        (blocks, inProgress) => {
          if (blocks[0]) setStreamPreview(fromBlock(blocks[0].values));
          else if (inProgress)
            setStreamPreview(fromBlock(inProgress.values));
        },
      );
      const final0 = final[0];
      if (final0) setOutput(fromBlock(final0.values));
      setStreamPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      showToast("Generation failed");
    } finally {
      setStreaming(false);
    }
  };

  const onCopy = async () => {
    if (!output) return;
    const text = `Subject: ${output.subject}\nPreheader: ${output.preheader}\n\n${output.body}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied");
    } catch {
      showToast("Copy failed");
    }
  };

  const onSave = async () => {
    if (!output) return;
    const brief = buildBrief();
    try {
      await saveGeneratedEmail({
        event_id: brief.event_id,
        profile_id: brief.profile_id,
        source_script_id: brief.source_script_id,
        brand: brief.brand,
        topic: brief.topic,
        brief_json: brief,
        output_json: output,
      });
      showToast(eventId ? "Saved + attached to event" : "Saved");
    } catch {
      showToast("Save failed");
    }
  };

  const live = streaming ? streamPreview : output;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-6 pb-15">
      <AppShell
        userEmail={userEmail}
        isAdmin={isAdmin}
        current="scripts"
        homeHref="/scripts"
        title="Email"
        subtitle="Subject + preheader + body, in voice"
        printHidden
      />
      <ScriptsTabsNav active="email" />

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
            <label className={labelCls}>Audience</label>
            <select
              value={audience}
              onChange={(e) =>
                setAudience(e.target.value as EmailBrief["audience"])
              }
              className={inputCls}
            >
              {EMAIL_AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3.5">
            <label className={labelCls}>Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={inputCls}
            />
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
            <label className={labelCls}>CTA Copy</label>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Reserve a seat"
              className={inputCls}
            />
          </div>

          <div className="mb-3.5">
            <label className={labelCls}>CTA URL</label>
            <input
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://eatatditch.com/…"
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
            {streaming ? "Generating…" : "Generate Email"}
          </button>
          {error && (
            <p className="mt-2 text-[12px] text-[var(--cat-event)]">{error}</p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          {!live && !streaming && (
            <div className="rounded-[10px] border-[1.5px] border-dashed border-line bg-white px-6 py-12 text-center">
              <p className="m-0 font-bebas text-[20px] tracking-[0.08em] text-muted">
                EMAIL WILL APPEAR HERE
              </p>
            </div>
          )}
          {(live || streaming) && (
            <article
              className={`rounded-[10px] border-[1.5px] bg-white p-5 shadow-card ${
                streaming
                  ? "border-orange ring-[3px] ring-orange/15"
                  : "border-line"
              }`}
            >
              <div className="mb-3 flex items-baseline justify-between">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">
                  Email draft
                  {streaming && (
                    <span className="ml-2 text-muted">writing…</span>
                  )}
                </div>
                {!streaming && output && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onCopy}
                      className="rounded-sm border border-line bg-white px-2 py-1 text-[11px] font-semibold text-ink hover:bg-sand"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={onSave}
                      className="rounded-sm border border-ink bg-white px-2 py-1 text-[11px] font-semibold text-ink hover:bg-sand"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Subject ({live?.subject.length ?? 0} chars)
                </div>
                <div className="font-bebas text-[20px] leading-tight tracking-[0.04em] text-navy">
                  {live?.subject || (streaming ? "…" : "")}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Preheader ({live?.preheader.length ?? 0} chars)
                </div>
                <div className="text-[13px] italic text-muted">
                  {live?.preheader || (streaming ? "…" : "")}
                </div>
              </div>

              <pre className="m-0 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-sm border border-line bg-cream px-3 py-2.5 font-dm text-[13.5px] leading-[1.6] text-ink">
                {live?.body}
                {streaming && live?.body && (
                  <span className="ml-0.5 inline-block h-[14px] w-[7px] animate-pulse bg-ink align-middle" />
                )}
              </pre>
            </article>
          )}
        </section>
      </div>

      <Toast message={toastMsg} />
    </div>
  );
}
