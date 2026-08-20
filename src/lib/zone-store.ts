"use client";

import { DEFAULT_ZONES, expireRuns, loadZones, saveZones, type Zone } from "@/lib/zones";

let zones: Zone[] | null = null;
const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): Zone[] {
  if (zones === null) zones = loadZones();
  return zones;
}

/** Prerendered snapshot: localStorage is not available during the static build. */
export function getServerSnapshot(): Zone[] {
  return DEFAULT_ZONES;
}

function commit(next: Zone[]): void {
  zones = next;
  saveZones(next);
  listeners.forEach((listener) => listener());
}

export function replaceZone(updated: Zone): void {
  commit(getSnapshot().map((zone) => (zone.id === updated.id ? updated : zone)));
}

/** Applies elapsed run windows; returns true when something changed. */
export function tick(): boolean {
  const current = getSnapshot();
  const next = expireRuns(current);
  if (next.every((zone, index) => zone === current[index])) return false;
  commit(next);
  return true;
}
