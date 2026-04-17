import { DoseEvent, Substance } from "@/src/types/domain";
import { routeLabel } from "@/src/lib/utils/labels";

export function DoseEventCard({
  event,
  substance,
}: {
  event: DoseEvent;
  substance?: Substance;
}) {
  const time = new Date(event.takenAt).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="rounded-2xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-zinc-500">{time}</span>
        <span className="text-xs text-zinc-500">{routeLabel[event.route]}</span>
      </div>

      <div className="font-medium">
        {substance?.displayName ?? event.substanceId}
      </div>

      <div className="mt-1 text-sm text-zinc-700">
        {event.doseValue} {event.doseUnit}
      </div>

      {event.note ? (
        <div className="mt-2 text-sm text-zinc-600">{event.note}</div>
      ) : null}

      {event.symptoms?.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {event.symptoms.map((symptom) => (
            <span key={symptom} className="rounded-full bg-zinc-100 px-2 py-1 text-xs">
              {symptom}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}