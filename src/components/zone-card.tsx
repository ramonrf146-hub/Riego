"use client";

import { useEffect, useState } from "react";
import {
  setDuration,
  setSchedule,
  startZone,
  stopZone,
  type Zone,
} from "@/lib/zones";

const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

function remainingLabel(runsUntil: number | null, now: number): string {
  if (runsUntil === null) return "";
  const seconds = Math.max(0, Math.round((runsUntil - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")} restantes`;
}

export function ZoneCard({ zone, onChange }: { zone: Zone; onChange: (zone: Zone) => void }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!zone.running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [zone.running]);

  function toggleDay(day: number) {
    const days = zone.schedule.days.includes(day)
      ? zone.schedule.days.filter((value) => value !== day)
      : [...zone.schedule.days, day].sort((a, b) => a - b);
    onChange(setSchedule(zone, { days }));
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
        onClick={() => onChange(zone.running ? stopZone(zone) : startZone(zone))}
        className={`mt-4 w-full rounded-xl px-4 py-3 text-base font-medium text-white transition ${
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
          onChange={(event) => onChange(setDuration(zone, Number(event.target.value)))}
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
              onChange={(event) => onChange(setSchedule(zone, { enabled: event.target.checked }))}
              className="h-4 w-4 accent-emerald-600"
            />
            Activa
          </label>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <input
            type="time"
            value={zone.schedule.startTime}
            onChange={(event) => onChange(setSchedule(zone, { startTime: event.target.value }))}
            className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
          <div className="flex flex-wrap gap-1">
            {DAY_LABELS.map((label, day) => (
              <button
                key={day}
                type="button"
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
    </section>
  );
}
