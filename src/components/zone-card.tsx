"use client";

import { useEffect, useState, useTransition } from "react";
import type { Zone } from "@/lib/zones";

const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

function remainingLabel(runsUntil: number | null, now: number): string {
  if (runsUntil === null) return "";
  const seconds = Math.max(0, Math.round((runsUntil - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")} restantes`;
}

export function ZoneCard({ zone, onChange }: { zone: Zone; onChange: (zone: Zone) => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!zone.running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [zone.running]);

  function patch(update: Record<string, unknown>) {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/zones/${zone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!response.ok) {
        setError("No se pudo actualizar la zona");
        return;
      }
      const data = (await response.json()) as { zone: Zone };
      onChange(data.zone);
    });
  }

  function toggleDay(day: number) {
    const days = zone.schedule.days.includes(day)
      ? zone.schedule.days.filter((value) => value !== day)
      : [...zone.schedule.days, day];
    patch({ schedule: { days } });
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-neutral-900">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{zone.name}</h2>
          <p className="text-sm text-neutral-500">
            {zone.running
              ? remainingLabel(zone.runsUntil, now)
              : zone.lastWateredAt
                ? `Último riego: ${new Date(zone.lastWateredAt).toLocaleString("es-ES")}`
                : "Sin riegos registrados"}
          </p>
        </div>
        <span
          className={`h-3 w-3 shrink-0 rounded-full ${zone.running ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"}`}
          aria-hidden
        />
      </header>

      <button
        type="button"
        disabled={pending}
        onClick={() => patch({ running: !zone.running })}
        className={`mt-4 w-full rounded-xl px-4 py-3 text-base font-medium text-white transition disabled:opacity-60 ${
          zone.running ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
        }`}
      >
        {zone.running ? "Detener riego" : "Regar ahora"}
      </button>

      <label className="mt-4 block text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">
          Duración: {zone.durationMinutes} min
        </span>
        <input
          type="range"
          min={1}
          max={120}
          value={zone.durationMinutes}
          disabled={pending}
          onChange={(event) => patch({ durationMinutes: Number(event.target.value) })}
          className="mt-2 w-full accent-emerald-600"
        />
      </label>

      <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/15">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Programación</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={zone.schedule.enabled}
              disabled={pending}
              onChange={(event) => patch({ schedule: { enabled: event.target.checked } })}
              className="h-4 w-4 accent-emerald-600"
            />
            Activa
          </label>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <input
            type="time"
            value={zone.schedule.startTime}
            disabled={pending}
            onChange={(event) => patch({ schedule: { startTime: event.target.value } })}
            className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
          <div className="flex flex-wrap gap-1">
            {DAY_LABELS.map((label, day) => (
              <button
                key={day}
                type="button"
                disabled={pending}
                onClick={() => toggleDay(day)}
                className={`h-8 w-8 rounded-full text-xs font-medium transition ${
                  zone.schedule.days.includes(day)
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
