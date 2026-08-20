export type Zone = {
  id: string;
  name: string;
  running: boolean;
  /** Minutes the zone runs when started manually. */
  durationMinutes: number;
  /** Epoch ms when the current manual run ends, null when idle. */
  runsUntil: number | null;
  schedule: Schedule;
  lastWateredAt: number | null;
};

export type Schedule = {
  enabled: boolean;
  /** "HH:MM" in 24h local time. */
  startTime: string;
  /** 0 = Sunday ... 6 = Saturday. */
  days: number[];
};

const STORAGE_KEY = "riego.zones.v1";

export const DEFAULT_ZONES: Zone[] = [
  {
    id: "zona-1",
    name: "Zona 1",
    running: false,
    durationMinutes: 15,
    runsUntil: null,
    schedule: { enabled: true, startTime: "07:00", days: [1, 3, 5] },
    lastWateredAt: null,
  },
  {
    id: "zona-2",
    name: "Zona 2",
    running: false,
    durationMinutes: 20,
    runsUntil: null,
    schedule: { enabled: false, startTime: "06:30", days: [0, 2, 4, 6] },
    lastWateredAt: null,
  },
  {
    id: "zona-3",
    name: "Zona 3",
    running: false,
    durationMinutes: 10,
    runsUntil: null,
    schedule: { enabled: true, startTime: "19:00", days: [0, 1, 2, 3, 4, 5, 6] },
    lastWateredAt: null,
  },
];

export function loadZones(): Zone[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ZONES;
    return expireRuns(JSON.parse(raw) as Zone[]);
  } catch {
    return DEFAULT_ZONES;
  }
}

export function saveZones(zones: Zone[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
  } catch {
    // Storage unavailable (private mode); state stays in memory only.
  }
}

/** Stops zones whose manual run window has elapsed. */
export function expireRuns(zones: Zone[]): Zone[] {
  const now = Date.now();
  return zones.map((zone) =>
    zone.running && zone.runsUntil !== null && zone.runsUntil <= now
      ? { ...zone, running: false, runsUntil: null, lastWateredAt: zone.runsUntil }
      : zone,
  );
}

export function startZone(zone: Zone): Zone {
  return { ...zone, running: true, runsUntil: Date.now() + zone.durationMinutes * 60_000 };
}

export function stopZone(zone: Zone): Zone {
  return { ...zone, running: false, runsUntil: null, lastWateredAt: Date.now() };
}

export function setDuration(zone: Zone, durationMinutes: number): Zone {
  const minutes = Math.min(240, Math.max(1, Math.round(durationMinutes)));
  return {
    ...zone,
    durationMinutes: minutes,
    runsUntil: zone.running ? Date.now() + minutes * 60_000 : zone.runsUntil,
  };
}

export function setSchedule(zone: Zone, schedule: Partial<Schedule>): Zone {
  return { ...zone, schedule: { ...zone.schedule, ...schedule } };
}
