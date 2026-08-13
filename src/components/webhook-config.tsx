"use client";

import { useState } from "react";
import { Copy, Check, HelpCircle } from "lucide-react";
import { FiGithub } from "react-icons/fi";
import { Button } from "@/components/ui/button";

export function WebhookConfig({ webhookUrl }: { webhookUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy webhook:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Webhook input box with copy button */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          GitHub Webhook URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex h-9 w-full rounded-xl border border-input bg-muted/30 px-3 py-1 text-xs shadow-3xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground font-mono"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0 rounded-xl hover:bg-muted/50 transition-all cursor-pointer"
            title="Copy URL to clipboard"
          >
            {copied ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Copy className="size-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Accordion instructions block */}
      <div className="border border-border/40 bg-muted/10 rounded-xl p-4.5 space-y-3.5 text-xs font-semibold leading-relaxed text-foreground">
        <div className="flex items-center gap-1.5 border-b border-border/10 pb-2 text-primary">
          <FiGithub className="size-4" />
          <span className="font-bold">How to configure inside GitHub:</span>
        </div>

        <ol className="list-decimal list-inside space-y-2 pr-1">
          <li>
            Go to your repository settings on GitHub, select <span className="text-primary font-bold">Webhooks</span>, and click <span className="text-primary font-bold">Add webhook</span>.
          </li>
          <li>
            Paste the copied URL above into the <span className="font-bold">Payload URL</span> input.
          </li>
          <li>
            Set the <span className="font-bold">Content type</span> dropdown to <span className="text-color-iris font-bold">application/json</span>.
          </li>
          <li>
            Under <span className="font-bold">Which events would you like to trigger this webhook?</span>, select <span className="font-bold">Just the push event</span>.
          </li>
          <li>
            Click <span className="text-emerald-500 font-bold">Add webhook</span>. Nexus will now log every commit push into the workspace activity feed.
          </li>
        </ol>

        <div className="flex items-start gap-1.5 pt-1.5 text-muted-foreground text-[10px]">
          <HelpCircle className="size-3.5 shrink-0 mt-0.5" />
          <p className="leading-normal">
            Note: Nexus parses commit emails to map pushes to your workspace members. If the email doesn't match any registered member, the activity log defaults to the workspace owner.
          </p>
        </div>
      </div>
    </div>
  );
}
