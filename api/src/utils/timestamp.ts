export function isoTimestamp(date: Date = new Date()): string {
  const pad = (n: number): string => n.toString().padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mi = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}-${mi}-${ss}`;
}

export function buildBlobName(
  prefix: "originals" | "converted",
  route: string,
  safeFilename: string,
  timestamp: string = isoTimestamp()
): string {
  return `${prefix}/${route}/${timestamp}_${safeFilename}`;
}
