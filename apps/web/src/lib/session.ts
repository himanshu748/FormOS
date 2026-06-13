import { genId } from "./ids";

/**
 * A stable per-visit anonymous token, persisted for the tab so a page refresh
 * keeps pairing the view with its eventual submission (for completion time).
 */
export function getSessionId(slug: string): string {
  if (typeof window === "undefined") return "";
  const key = `formos:sess:${slug}`;
  let id = window.sessionStorage.getItem(key);
  if (!id) {
    id = genId("s");
    window.sessionStorage.setItem(key, id);
  }
  return id;
}
