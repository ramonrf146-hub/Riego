import { listZones } from "@/lib/zones";
import { ZoneList } from "@/components/zone-list";

export const dynamic = "force-dynamic";

export default async function Home() {
  const zones = await listZones();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold">Control de riego</h1>
      <ZoneList initialZones={zones} />
    </main>
  );
}
