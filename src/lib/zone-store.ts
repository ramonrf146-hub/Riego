"use client";

import {
  DEFAULT_ZONES,
  expireRuns,
  loadBackendUrl,
  loadZones,
  saveBackendUrl,
  saveZones,
  type Zone,
} from "@/lib/zones";

export type Connection = "local" | "online" | "error";

export type State = {
  zones: Zone[];
  /** Node-RED base URL; empty means the app runs standalone in the browser. */
  backendUrl: string;
  connection: Connection;
};

const SERVER_STATE: State = { zones: DEFAULT_ZONES, backendUrl: "", connection: "local" };

let state: State | null = null;
const listeners = new Set<() => void>();

function emit(next: State): void {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): State {
  if (state === null) {
    const backendUrl = loadBackendUrl();
    state = { zones: loadZones(), backendUrl, connection: backendUrl ? "error" : "local" };
  }
  return state;
}

/** Prerendered snapshot: localStorage is not available during the static build. */
export function getServerSnapshot(): State {
  return SERVER_STATE;
}

function endpoint(backendUrl: string, path: string): string {
  return `${backendUrl.replace(/\/+$/, "")}${path}`;
}

export function setBackendUrl(backendUrl: string): void {
  const trimmed = backendUrl.trim();
  saveBackendUrl(trimmed);
  emit({ ...getSnapshot(), backendUrl: trimmed, connection: trimmed ? "error" : "local" });
  if (trimmed) void refresh();
}

/** Pulls the authoritative zone state from Node-RED. */
export async function refresh(): Promise<void> {
  const current = getSnapshot();
  if (!current.backendUrl) return;
  try {
    const response = await fetch(endpoint(current.backendUrl, "/riego/estado"), {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { zones?: Zone[] };
    if (!Array.isArray(data.zones)) throw new Error("Respuesta inválida");
    emit({ ...getSnapshot(), zones: data.zones, connection: "online" });
  } catch {
    emit({ ...getSnapshot(), connection: "error" });
  }
}

export function replaceZone(updated: Zone): void {
  const current = getSnapshot();
  const zones = current.zones.map((zone) => (zone.id === updated.id ? updated : zone));

  if (!current.backendUrl) {
    saveZones(zones);
    emit({ ...current, zones });
    return;
  }

  emit({ ...current, zones });
  void push(updated);
}

async function push(zone: Zone): Promise<void> {
  const current = getSnapshot();
  try {
    const response = await fetch(endpoint(current.backendUrl, `/riego/zona/${zone.id}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        running: zone.running,
        durationMinutes: zone.durationMinutes,
        schedule: zone.schedule,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    emit({ ...getSnapshot(), connection: "online" });
  } catch {
    emit({ ...getSnapshot(), connection: "error" });
  }
}

/** Advances local run timers; Node-RED owns the timers when connected. */
export function tick(): void {
  const current = getSnapshot();
  if (current.backendUrl) return;
  const zones = expireRuns(current.zones);
  if (zones.every((zone, index) => zone === current.zones[index])) return;
  saveZones(zones);
  emit({ ...current, zones });
}
