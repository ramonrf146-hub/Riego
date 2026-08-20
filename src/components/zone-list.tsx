"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  refresh,
  replaceZone,
  subscribe,
  tick,
} from "@/lib/zone-store";
import { ConnectionSettings } from "@/components/connection-settings";
import { ZoneCard } from "@/components/zone-card";

const POLL_MS = 3000;

export function ZoneList() {
  const { zones, backendUrl, connection } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!backendUrl) return;
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [backendUrl]);

  const running = zones.filter((zone) => zone.running).length;

  return (
    <>
      <p className="text-sm text-neutral-500">
        {running === 0 ? "Ninguna zona regando" : `${running} zona(s) regando ahora`}
      </p>
      <ConnectionSettings key={backendUrl} backendUrl={backendUrl} connection={connection} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => (
          <ZoneCard key={zone.id} zone={zone} onChange={replaceZone} />
        ))}
      </div>
    </>
  );
}
