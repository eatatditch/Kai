import { NextResponse } from "next/server";
import { requireAllowlistedUser } from "@/lib/scripts/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAllowlistedUser();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Not signed in" : "Not authorized" },
      { status: auth.status },
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const name = file.name || "reference";
  const lower = name.toLowerCase();
  const ext = lower.split(".").pop() ?? "";

  try {
    if (ext === "txt" || ext === "md") {
      const content = await file.text();
      return NextResponse.json({
        title: stripExt(name),
        source_format: ext,
        content: content.trim(),
      });
    }

    if (ext === "pdf") {
      const buf = Buffer.from(await file.arrayBuffer());
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buf);
      return NextResponse.json({
        title: stripExt(name),
        source_format: "pdf",
        content: parsed.text.trim(),
      });
    }

    if (ext === "docx") {
      const buf = Buffer.from(await file.arrayBuffer());
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: buf });
      return NextResponse.json({
        title: stripExt(name),
        source_format: "docx",
        content: result.value.trim(),
      });
    }

    return NextResponse.json(
      {
        error: `Unsupported file type ".${ext}". Use .txt, .md, .pdf, or .docx.`,
      },
      { status: 400 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to parse file";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}
