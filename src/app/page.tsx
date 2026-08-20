import { ZoneList } from "@/components/zone-list";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold">Control de riego</h1>
      <ZoneList />
    </main>
  );
}
