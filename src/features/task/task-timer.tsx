"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Play, Square, Timer, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type TimeLogInfo,
  startTaskTimerAction,
  stopTaskTimerAction,
  listTaskTimeLogsAction,
} from "@/server/actions/time-log.actions";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

function formatTime(isoString: string) {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function TaskTimer({ taskId, currentUserId }: { taskId: string; currentUserId: string }) {
  const [logs, setLogs] = useState<TimeLogInfo[]>([]);
  const [activeLog, setActiveLog] = useState<TimeLogInfo | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Load past time logs and active timer on mount
  useEffect(() => {
    startTransition(async () => {
      const res = await listTaskTimeLogsAction(taskId);
      if (res.ok) {
        setLogs(res.data);
        // Find if current user has an active running timer on this task
        const active = res.data.find((l) => l.endTime === null && l.user.id === currentUserId);
        if (active) {
          setActiveLog(active);
          const startMs = new Date(active.startTime).getTime();
          setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
        } else {
          setActiveLog(null);
          setElapsed(0);
        }
      }
    });
  }, [taskId, currentUserId]);

  // Live timer interval counting active seconds
  useEffect(() => {
    if (!activeLog) return;

    const interval = setInterval(() => {
      const startMs = new Date(activeLog.startTime).getTime();
      setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeLog]);

  const handleStart = async () => {
    const res = await startTaskTimerAction(taskId);
    if (res.ok) {
      setActiveLog(res.data);
      setElapsed(0);
      // Reload logs list to include active timer capsule
      const reload = await listTaskTimeLogsAction(taskId);
      if (reload.ok) setLogs(reload.data);
      toast.success("Timer started!");
    } else {
      toast.error(res.error || "Failed to start timer.");
    }
  };

  const handleStop = async () => {
    const res = await stopTaskTimerAction(taskId);
    if (res.ok) {
      setActiveLog(null);
      setElapsed(0);
      // Reload logs list to include updated duration details
      const reload = await listTaskTimeLogsAction(taskId);
      if (reload.ok) setLogs(reload.data);
      toast.success(`Timer stopped! Logged ${formatDuration(res.data.duration || 0)}.`);
    } else {
      toast.error(res.error || "Failed to stop timer.");
    }
  };

  // Format active countdown time helper (00:00:00)
  const formatTimerDisplay = (sec: number) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const totalLogged = logs.reduce((acc, curr) => acc + (curr.duration || 0), 0);

  return (
    <Card className="border-border/40 bg-card/45 backdrop-blur-xl shadow-xs overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/10 pb-3">
          <div className="flex items-center gap-2">
            <Timer className="size-4.5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Time Tracking</h3>
          </div>
          {totalLogged > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/20">
              Total: {formatDuration(totalLogged)}
            </span>
          )}
        </div>

        {/* Timer Control panel */}
        <div className="flex items-center justify-between bg-muted/20 border border-border/30 rounded-xl p-4">
          {activeLog ? (
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Timer</p>
                <p className="text-lg font-mono font-bold text-foreground tabular-nums">
                  {formatTimerDisplay(elapsed)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4 shrink-0" />
              <span className="text-xs font-semibold">No active timer running</span>
            </div>
          )}

          {activeLog ? (
            <Button
              onClick={handleStop}
              disabled={isPending}
              variant="destructive"
              size="sm"
              className="font-bold gap-1.5 h-9 rounded-lg"
            >
              <Square className="size-3.5 fill-current" />
              Stop Timer
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={isPending}
              variant="outline"
              size="sm"
              className="font-bold gap-1.5 border-emerald-500/20 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 h-9 rounded-lg cursor-pointer"
            >
              <Play className="size-3.5 fill-current" />
              Start Timer
            </Button>
          )}
        </div>

        {/* Previous Log history list */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Log History</p>
          {logs.length === 0 ? (
            <p className="text-[10px] font-semibold text-muted-foreground italic">No time logs tracked yet.</p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: "thin" }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border border-border/10 bg-muted/10 rounded-lg p-2.5 text-xs font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">{log.user.name || "User"}</span>
                    {log.endTime === null && (
                      <span className="text-[8px] bg-rose-500/10 text-rose-500 border border-rose-500/25 px-1 rounded-sm font-mono font-bold animate-pulse">
                        RUNNING
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{formatTime(log.startTime)}</span>
                    <span>•</span>
                    <span className="text-foreground font-mono font-bold">
                      {log.duration !== null ? formatDuration(log.duration) : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
