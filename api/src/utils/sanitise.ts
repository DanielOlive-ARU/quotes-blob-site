const MAX_FILENAME_LENGTH = 120;

export function sanitiseFilename(filename: string): string {
  const replaced = filename
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/_+/g, "_");
  return replaced.slice(0, MAX_FILENAME_LENGTH);
}

export function replaceExtension(filename: string, newExtension: string): string {
  const idx = filename.lastIndexOf(".");
  const base = idx > 0 ? filename.slice(0, idx) : filename;
  const ext = newExtension.startsWith(".") ? newExtension : `.${newExtension}`;
  return `${base}${ext}`;
}
