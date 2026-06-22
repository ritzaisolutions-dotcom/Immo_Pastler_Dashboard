type DbErrorLike = {
  code?: string;
  message?: string;
};

export function mapDbError(error: DbErrorLike | null | undefined): string {
  if (!error) {
    return "Speichern fehlgeschlagen. Bitte erneut versuchen.";
  }

  if (error.code === "23505") {
    const msg = (error.message ?? "").toLowerCase();
    if (msg.includes("email")) {
      return "Diese E-Mail-Adresse ist bereits vergeben.";
    }
    return "Dieser Eintrag existiert bereits.";
  }

  return "Speichern fehlgeschlagen. Bitte erneut versuchen.";
}

export function mapUploadError(code: string): string {
  switch (code) {
    case "file required":
      return "Bitte eine Bilddatei auswählen.";
    case "invalid file type":
      return "Ungültiges Dateiformat. Erlaubt: JPEG, PNG oder WebP.";
    case "file too large":
      return "Datei zu groß (max. 2 MB).";
    case "Upload failed":
      return "Bild-Upload fehlgeschlagen. Bitte erneut versuchen.";
    case "Update failed":
      return "Inserat konnte nach dem Upload nicht aktualisiert werden.";
    default:
      return "Bild-Upload fehlgeschlagen. Bitte erneut versuchen.";
  }
}

export const API_ERRORS = {
  notFound: "Eintrag nicht gefunden.",
  noFieldsToUpdate: "Keine Änderungen zum Speichern.",
} as const;
