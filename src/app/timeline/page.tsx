import { DoseEventCard } from "@/components/events/dose-event-card";
import { mockEvents } from "@/lib/mock/events";
import { substances } from "@/lib/mock/substances";

export default function TimelinePage() {
  const substanceMap = new Map(substances.map((s) => [s.id, s]));
  const sorted = [...mockEvents].sort(
    (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
  );

  return (
    <main className="mx-auto min-h-screen max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">今日のタイムライン</h1>
      <div className="space-y-3">
        {sorted.map((event) => (
          <DoseEventCard
            key={event.id}
            event={event}
            substance={substanceMap.get(event.substanceId)}
          />
        ))}
      </div>
    </main>
  );
}