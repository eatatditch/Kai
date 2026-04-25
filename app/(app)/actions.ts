"use server";

import { revalidatePath } from "next/cache";

import { setActiveBrandCookie } from "@/lib/active-brand";

export async function switchActiveBrand(slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) return;
  await setActiveBrandCookie(slug);
  revalidatePath("/", "layout");
}
