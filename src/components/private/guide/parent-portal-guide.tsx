import { cn } from "@/lib/utils";
import { PlayCircle } from "lucide-react";
import { useRef, useState } from "react";

type GuideVideo = { id: string; title: string };

const GROUPS: { label: string; videos: GuideVideo[] }[] = [
  {
    label: "Your account",
    videos: [
      { id: "create-account", title: "Create your account" },
      { id: "sign-in", title: "Sign in" },
      { id: "reset-password", title: "Reset a forgotten password" },
      { id: "dashboard", title: "Your dashboard" },
    ],
  },
  {
    label: "Enrolment",
    videos: [
      { id: "enrol-new", title: "Enrol a new student" },
      { id: "enrol-current", title: "Enrol a current student" },
      { id: "saved-drafts", title: "Continue a saved draft" },
      { id: "enrolment-status", title: "Check your enrolment status" },
      { id: "update-document", title: "Update a document" },
    ],
  },
  {
    label: "Services",
    videos: [
      { id: "report-card", title: "View a report card" },
      { id: "absence-travel", title: "Tell the school about an absence or travel" },
      { id: "school-event", title: "Register for a school event" },
    ],
  },
];

const FIRST = GROUPS[0].videos[0];

/** Short videos showing how to use the portal, one at a time. */
export function ParentPortalGuide() {
  const [video, setVideo] = useState(FIRST);
  const player = useRef<HTMLVideoElement>(null);

  function open(next: GuideVideo) {
    setVideo(next);
    // Wait for the new source to be set before playing it.
    requestAnimationFrame(() => void player.current?.play()?.catch(() => {}));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Parent Portal Guide</h2>
        <p className="text-lg text-muted-foreground">Learn how to navigate and use the parent portal effectively</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <video
          ref={player}
          key={video.id}
          aria-label={video.title}
          src={`/guide/${video.id}.mp4`}
          poster={`/guide/${video.id}.jpg`}
          controls
          playsInline
          preload="none"
          className="aspect-video w-full rounded-xl bg-primary shadow-sm"
        />

        <nav aria-label="Guide videos" className="space-y-4 lg:order-first">
          {GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-3 text-sm font-bold text-foreground">{group.label}</p>
              {group.videos.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  aria-current={v.id === video.id ? "true" : undefined}
                  onClick={() => open(v)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    v.id === video.id
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}>
                  <PlayCircle className="mt-0.5 size-4 shrink-0" />
                  {v.title}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
