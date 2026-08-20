import { updateZone, type ZoneUpdate } from "@/lib/zones";

function parseUpdate(body: unknown): ZoneUpdate | null {
  if (typeof body !== "object" || body === null) return null;
  const input = body as Record<string, unknown>;
  const update: ZoneUpdate = {};

  if ("running" in input) {
    if (typeof input.running !== "boolean") return null;
    update.running = input.running;
  }

  if ("durationMinutes" in input) {
    const minutes = input.durationMinutes;
    if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes < 1 || minutes > 240) {
      return null;
    }
    update.durationMinutes = Math.round(minutes);
  }

  if ("schedule" in input) {
    const schedule = input.schedule;
    if (typeof schedule !== "object" || schedule === null) return null;
    const parsed: ZoneUpdate["schedule"] = {};
    const raw = schedule as Record<string, unknown>;

    if ("enabled" in raw) {
      if (typeof raw.enabled !== "boolean") return null;
      parsed.enabled = raw.enabled;
    }
    if ("startTime" in raw) {
      if (typeof raw.startTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(raw.startTime)) {
        return null;
      }
      parsed.startTime = raw.startTime;
    }
    if ("days" in raw) {
      if (
        !Array.isArray(raw.days) ||
        raw.days.some((day) => typeof day !== "number" || day < 0 || day > 6)
      ) {
        return null;
      }
      parsed.days = Array.from(new Set(raw.days as number[])).sort();
    }
    update.schedule = parsed;
  }

  return update;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  const update = parseUpdate(body);
  if (!update) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const zone = await updateZone(id, update);
  if (!zone) {
    return Response.json({ error: "Zona no encontrada" }, { status: 404 });
  }

  return Response.json({ zone });
}
