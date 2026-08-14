"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ACTIVITY_LABELS, type ActivityActionType } from "@/lib/activity";
import { loadMoreActivityAction } from "@/server/actions/activity.actions";

import { ACTIVITY_PAGE_SIZE, type ActivityFeedItem } from "@/lib/activity";

export function ActivityFeed({
  workspaceId,
  initialItems,
}: {
  workspaceId: string;
  initialItems: ActivityFeedItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(
    initialItems.length === ACTIVITY_PAGE_SIZE,
  );
  const [pending, startTransition] = useTransition();

  function loadMore() {
    const cursor = items[items.length - 1]?.id;
    if (!cursor) return;
    startTransition(async () => {
      const result = await loadMoreActivityAction(workspaceId, cursor);
      if (result.ok) {
        setItems((prev) => [...prev, ...result.data]);
        setHasMore(result.data.length === ACTIVITY_PAGE_SIZE);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-1">
        {items.map((item) => {
          const label =
            ACTIVITY_LABELS[item.action as ActivityActionType] ?? item.action;
          return (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-4 border-b py-3 last:border-b-0"
            >
              <p className="text-sm">
                <span className="font-medium">{item.actorName}</span>{" "}
                <span className="text-muted-foreground">{label}</span>
                {item.detail ? (
                  <span className="font-medium"> “{item.detail}”</span>
                ) : null}
              </p>
              <time
                className="text-muted-foreground shrink-0 text-xs"
                dateTime={item.createdAtISO}
                suppressHydrationWarning
              >
                {new Date(item.createdAtISO).toLocaleString("en-US")}
              </time>
            </li>
          );
        })}
      </ol>

      {hasMore ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={pending}>
            {pending ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
