import { listZones } from "@/lib/zones";

export async function GET() {
  return Response.json({ zones: await listZones() });
}
