const configuredApiBase = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/$/, "");

// In local dev, use Vite proxy (/api) to avoid browser CORS issues.
const runtimeApiBase = import.meta.env.DEV ? "" : configuredApiBase;

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${runtimeApiBase}${normalizedPath}`;
}
