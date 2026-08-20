"use client";

import { useState } from "react";
import type { Connection } from "@/lib/zone-store";
import { setBackendUrl } from "@/lib/zone-store";

const STATUS: Record<Connection, { label: string; dot: string }> = {
  local: { label: "Solo este navegador", dot: "bg-neutral-400" },
  online: { label: "Conectado a Node-RED", dot: "bg-emerald-500" },
  error: { label: "Sin conexión con Node-RED", dot: "bg-red-500" },
};

export function ConnectionSettings({
  backendUrl,
  connection,
}: {
  backendUrl: string;
  connection: Connection;
}) {
  const [draft, setDraft] = useState(backendUrl);
  const [open, setOpen] = useState(false);

  const status = STATUS[connection];

  return (
    <div className="mt-2 text-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} aria-hidden />
        {status.label}
        <span aria-hidden>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setBackendUrl(draft);
          }}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          <input
            type="url"
            inputMode="url"
            placeholder="http://192.168.1.50:1880"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="w-64 rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
          >
            Guardar
          </button>
          <p className="w-full text-xs text-neutral-500">
            URL de Node-RED. Vacío = la app funciona sola, sin actuadores.
          </p>
        </form>
      )}
    </div>
  );
}
