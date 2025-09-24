import { get, set, del } from "idb-keyval";

const KEY = "mapbox_token";

const TOKEN_RE = /^pk\.[a-z0-9]{60,}$/i;

export async function migrateFromLocalStorage() {
  const legacy = localStorage.getItem("mapbox_token");
  if (legacy && TOKEN_RE.test(legacy)) {
    await set(KEY, legacy);
  }
  localStorage.removeItem("mapbox_token");
}

export async function saveTokenSecure(token: string) {
  if (!TOKEN_RE.test(token)) throw new Error("Invalid token format");
  await set(KEY, token);
}

export async function loadTokenSecure(): Promise<string | null> {
  const t = await get(KEY);
  return typeof t === "string" ? t : null;
}

export async function clearToken() {
  await del(KEY);
}