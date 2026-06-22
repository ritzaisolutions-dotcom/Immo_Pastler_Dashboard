import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { mapUploadError } from "@/lib/api-errors";
import {
  INSERAT_IMAGE_MAX_BYTES,
  INSERAT_IMAGE_MIME_TYPES,
  INSERAT_STORAGE_BUCKET,
} from "@/lib/inserat-storage";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: mapUploadError("file required") }, { status: 400 });
  }

  if (!INSERAT_IMAGE_MIME_TYPES.includes(file.type as (typeof INSERAT_IMAGE_MIME_TYPES)[number])) {
    return NextResponse.json({ error: mapUploadError("invalid file type") }, { status: 400 });
  }

  if (file.size > INSERAT_IMAGE_MAX_BYTES) {
    return NextResponse.json({ error: mapUploadError("file too large") }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${id}/profile.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await auth.supabase.storage
    .from(INSERAT_STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: mapUploadError("Upload failed") }, { status: 400 });
  }

  const { data: urlData } = auth.supabase.storage
    .from(INSERAT_STORAGE_BUCKET)
    .getPublicUrl(path);

  const bild_url = urlData.publicUrl;

  const { error: updateError } = await auth.supabase
    .from(TABLES.inserate)
    .update({ bild_url })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: mapUploadError("Update failed") }, { status: 400 });
  }

  return NextResponse.json({ bild_url });
}
