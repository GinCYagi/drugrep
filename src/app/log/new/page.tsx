"use client";

import { useState } from "react";
import { substances } from "@/lib/mock/substances";
import { Route } from "@/types/domain";

const routes: Route[] = ["oral", "sublingual", "rectal", "sniff", "inhaled", "other"];

export default function NewLogPage() {
  const [substanceId, setSubstanceId] = useState(substances[0]?.id ?? "");
  const [doseValue, setDoseValue] = useState("");
  const [doseUnit, setDoseUnit] = useState("mg");
  const [route, setRoute] = useState<Route>("oral");
  const [takenAt, setTakenAt] = useState("2026-04-15T08:00");

  return (
    <main className="mx-auto min-h-screen max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">服用記録</h1>

      <form className="space-y-4 rounded-2xl border p-4">
        <div>
          <label className="mb-2 block text-sm font-medium">物質名</label>
          <select
            className="w-full rounded-xl border p-3"
            value={substanceId}
            onChange={(e) => setSubstanceId(e.target.value)}
          >
            {substances.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">日時</label>
          <input
            className="w-full rounded-xl border p-3"
            type="datetime-local"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium">用量</label>
            <input
              className="w-full rounded-xl border p-3"
              type="number"
              value={doseValue}
              onChange={(e) => setDoseValue(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">単位</label>
            <input
              className="w-full rounded-xl border p-3"
              value={doseUnit}
              onChange={(e) => setDoseUnit(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">経路</label>
          <div className="flex flex-wrap gap-2">
            {routes.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoute(r)}
                className={`rounded-full px-3 py-2 text-sm ${
                  route === r ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-800"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-xl bg-zinc-900 px-4 py-3 font-medium text-white"
          onClick={() => {
            alert("ここではまだ保存しない。まずUIを固める段階。");
          }}
        >
          保存
        </button>
      </form>
    </main>
  );
}