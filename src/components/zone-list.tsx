"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  replaceZone,
  subscribe,
  tick,
} from "@/lib/zone-store";
import { ZoneCard } from "@/components/zone-card";

export function ZoneList() {
  const zones = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const running = zones.filter((zone) => zone.running).length;

  return (
    <>
      <p className="text-sm text-neutral-500">
        {running === 0 ? "Ninguna zona regando" : `${running} zona(s) regando ahora`}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => (
          <ZoneCard key={zone.id} zone={zone} onChange={replaceZone} />
        ))}
      </div>
    </>
  );
}
