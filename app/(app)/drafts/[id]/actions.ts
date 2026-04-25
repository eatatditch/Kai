"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type { DraftStatus } from "@/types/database";

export type ReviewState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

const INITIAL: ReviewState = { status: "idle" };

async function setStatus(
  draftId: string,
  newStatus: DraftStatus,
  reviewNotes: string | null,
): Promise<ReviewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const update: {
    status: DraftStatus;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    review_notes?: string | null;
  } = {
    status: newStatus,
  };

  // Only stamp reviewer fields on review-side transitions, not when an author
  // resubmits.
  if (
    newStatus === "approved" ||
    newStatus === "changes_requested" ||
    newStatus === "in_review"
  ) {
    update.reviewed_by = user.id;
    update.reviewed_at = new Date().toISOString();
    update.review_notes = reviewNotes;
  }

  const { error } = await supabase
    .from("content_drafts")
    .update(update)
    .eq("id", draftId);

  if (error) return { status: "error", message: error.message };

  revalidatePath(`/drafts/${draftId}`);
  revalidatePath("/drafts");
  revalidatePath("/calendar");
  return { status: "ok", message: "Updated." };
}

export async function submitForReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const draftId = String(formData.get("draft_id") ?? "");
  if (!draftId) return { status: "error", message: "Missing draft." };
  return setStatus(draftId, "in_review", null);
}

export async function approveDraft(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const draftId = String(formData.get("draft_id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!draftId) return { status: "error", message: "Missing draft." };
  return setStatus(draftId, "approved", notes);
}

export async function requestChanges(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const draftId = String(formData.get("draft_id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!draftId) return { status: "error", message: "Missing draft." };
  if (notes.length < 4) {
    return {
      status: "error",
      message: "Tell the author what to change.",
    };
  }
  return setStatus(draftId, "changes_requested", notes);
}

export async function archiveDraft(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const draftId = String(formData.get("draft_id") ?? "");
  if (!draftId) return { status: "error", message: "Missing draft." };
  return setStatus(draftId, "archived", null);
}

export async function scheduleDraft(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const draftId = String(formData.get("draft_id") ?? "");
  const scheduledAtRaw = String(formData.get("scheduled_at") ?? "").trim();
  if (!draftId) return { status: "error", message: "Missing draft." };
  if (!scheduledAtRaw) {
    return { status: "error", message: "Pick a date and time." };
  }

  const scheduledAt = new Date(scheduledAtRaw);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { status: "error", message: "Invalid date." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const { error } = await supabase
    .from("content_drafts")
    .update({
      status: "scheduled",
      scheduled_at: scheduledAt.toISOString(),
    })
    .eq("id", draftId);

  if (error) return { status: "error", message: error.message };

  revalidatePath(`/drafts/${draftId}`);
  revalidatePath("/drafts");
  revalidatePath("/calendar");
  return { status: "ok", message: "Scheduled." };
}

export { INITIAL as INITIAL_REVIEW_STATE };
