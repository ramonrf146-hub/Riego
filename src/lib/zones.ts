import { promises as fs } from "fs";
import path from "path";

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

const DATA_FILE = path.join(process.cwd(), "data", "zones.json");

const DEFAULT_ZONES: Zone[] = [
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

async function readZones(): Promise<Zone[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as Zone[];
  } catch {
    await writeZones(DEFAULT_ZONES);
    return DEFAULT_ZONES;
  }
}

async function writeZones(zones: Zone[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(zones, null, 2), "utf8");
}

/** Stops zones whose manual run window has elapsed. */
function expireRuns(zones: Zone[]): { zones: Zone[]; changed: boolean } {
  const now = Date.now();
  let changed = false;
  const next = zones.map((zone) => {
    if (zone.running && zone.runsUntil !== null && zone.runsUntil <= now) {
      changed = true;
      return { ...zone, running: false, runsUntil: null, lastWateredAt: zone.runsUntil };
    }
    return zone;
  });
  return { zones: next, changed };
}

export async function listZones(): Promise<Zone[]> {
  const { zones, changed } = expireRuns(await readZones());
  if (changed) await writeZones(zones);
  return zones;
}

export type ZoneUpdate = {
  running?: boolean;
  durationMinutes?: number;
  schedule?: Partial<Schedule>;
};

export async function updateZone(id: string, update: ZoneUpdate): Promise<Zone | null> {
  const zones = (await listZones()).slice();
  const index = zones.findIndex((zone) => zone.id === id);
  if (index === -1) return null;

  const current = zones[index];
  const durationMinutes = update.durationMinutes ?? current.durationMinutes;
  const next: Zone = {
    ...current,
    durationMinutes,
    schedule: { ...current.schedule, ...update.schedule },
  };

  if (update.running !== undefined && update.running !== current.running) {
    if (update.running) {
      next.running = true;
      next.runsUntil = Date.now() + durationMinutes * 60_000;
    } else {
      next.running = false;
      next.runsUntil = null;
      next.lastWateredAt = Date.now();
    }
  } else if (next.running && update.durationMinutes !== undefined) {
    next.runsUntil = Date.now() + durationMinutes * 60_000;
  }

  zones[index] = next;
  await writeZones(zones);
  return next;
}
