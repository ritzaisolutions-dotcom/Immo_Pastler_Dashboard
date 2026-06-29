"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { cn } from "@/lib/cn";

type ObjektPhotoUploadProps = {
  objektId: string;
  currentUrl: string | null;
};

export default function ObjektPhotoUpload({
  objektId,
  currentUrl,
}: ObjektPhotoUploadProps) {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`/api/objekte/${objektId}/bild`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Upload fehlgeschlagen");
        }
        toast.success("Foto hochgeladen");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload fehlgeschlagen");
      } finally {
        setUploading(false);
      }
    },
    [objektId, router],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void uploadFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "rounded-[4px] border-2 border-dashed p-6 text-center transition-colors",
        dragging ? "border-gold bg-gold-pale/30" : "border-border bg-warm-white",
      )}
    >
      {currentUrl ? (
        <img
          src={currentUrl}
          alt="Objektfoto"
          className="mx-auto mb-4 max-h-48 rounded-[4px] object-cover"
        />
      ) : (
        <Upload className="mx-auto mb-2 h-8 w-8 text-text-hint" />
      )}
      <p className="text-sm text-text-secondary">
        {uploading
          ? "Wird hochgeladen…"
          : "Foto hierher ziehen oder Datei wählen"}
      </p>
      <label className="mt-3 inline-block cursor-pointer rounded-[4px] bg-navy px-4 py-2 text-sm text-white hover:bg-navy-mid">
        Datei wählen
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
      </label>
    </div>
  );
}
