export function cdnMovieUrl(cdnBase: string, filename?: string): string {
  if (!filename) return "";
  if (filename.startsWith("http")) return filename;
  return `${cdnBase}/uploads/movies/${filename}`;
}
