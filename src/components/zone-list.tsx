"use client";

import { useCallback, useEffect, useState } from "react";
import type { Zone } from "@/lib/zones";
import { ZoneCard } from "@/components/zone-card";

const REFRESH_MS = 10_000;

export function ZoneList({ initialZones }: { initialZones: Zone[] }) {
  const [zones, setZones] = useState(initialZones);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/zones", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { zones: Zone[] };
    setZones(data.zones);
  }, []);

  useEffect(() => {
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  function handleChange(updated: Zone) {
    setZones((current) => current.map((zone) => (zone.id === updated.id ? updated : zone)));
  }

  const running = zones.filter((zone) => zone.running).length;

  return (
    <>
      <p className="text-sm text-neutral-500">
        {running === 0 ? "Ninguna zona regando" : `${running} zona(s) regando ahora`}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => (
          <ZoneCard key={zone.id} zone={zone} onChange={handleChange} />
        ))}
      </div>
    </>
  );
}
