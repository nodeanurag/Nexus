import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { getInvitationByToken, acceptWorkspaceInvitation } from "@/server/services/invitation.service";

export const metadata: Metadata = {
  title: "Join Workspace — Nexus",
};

interface InvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground">
        <Card className="max-w-md w-full border-border/80 shadow-lg text-center p-6">
          <CardHeader className="space-y-3">
            <div className="flex justify-center text-destructive">
              <ShieldAlert className="size-12" />
            </div>
            <CardTitle className="text-2xl font-bold">Missing Token</CardTitle>
            <CardDescription>
              An invitation token is required to join a workspace. Please check your invitation link.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Link href="/">
              <Button className="w-full font-semibold rounded-xl h-10">Back to home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 1. Fetch invitation details
  let invitation;
  try {
    invitation = await getInvitationByToken(token);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "This invitation is invalid or has expired.";
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground">
        <Card className="max-w-md w-full border-border/80 shadow-lg text-center p-6">
          <CardHeader className="space-y-3">
            <div className="flex justify-center text-destructive">
              <ShieldAlert className="size-12" />
            </div>
            <CardTitle className="text-2xl font-bold">Invitation Error</CardTitle>
            <CardDescription>
              {errorMsg}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Link href="/">
              <Button className="w-full font-semibold rounded-xl h-10">Back to home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Check if logged in
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  // Server action handler to accept invitation
  async function handleAccept() {
    "use server";
    if (!token || !session?.user?.id) return;
    try {
      const result = await acceptWorkspaceInvitation(token, session.user.id);
      if (result.projectId) {
        redirect(`/workspaces/${result.workspaceId}/projects/${result.projectId}`);
      } else {
        redirect(`/workspaces/${result.workspaceId}`);
      }
    } catch {
      // Fallback
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground animate-in fade-in duration-300">
      <Card className="max-w-lg w-full border-border/60 bg-card/90 shadow-2xl backdrop-blur-md overflow-hidden rounded-2xl">
        <div className="h-[4px] bg-gradient-to-r from-color-iris to-color-aubergine" />
        
        <CardHeader className="text-center pt-8 pb-4 space-y-4">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-color-mist border border-color-fog px-3 py-1 text-xs font-semibold font-mono text-color-iris">
            <Sparkles className="size-3.5" />
            <span>Workspace Invitation</span>
          </div>
          
          <CardTitle className="text-3xl font-extrabold tracking-tight text-color-ink">
            Join Team Directory
          </CardTitle>
          <CardDescription className="text-color-slate text-sm max-w-sm mx-auto">
            You have been invited by <span className="font-semibold text-color-ink">{invitation.invitedBy.name}</span> to collaborate on Nexus.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 px-8 pb-8 pt-4">
          <div className="rounded-xl border border-color-fog bg-color-mist/20 p-5 space-y-3.5">
            <div className="flex justify-between items-center text-xs font-semibold font-mono text-color-slate">
              <span>WORKSPACE</span>
              <span className="text-color-iris uppercase tracking-wider">Active Invitation</span>
            </div>
            <div className="text-lg font-bold text-color-ink">
              {invitation.workspace.name}
            </div>

            {invitation.projectId && (
              <div className="pt-2.5 border-t border-color-fog/40 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold font-mono text-color-slate uppercase">Project Attachment</span>
                <span className="text-xs font-semibold text-color-iris inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  Redirect to attached project details upon acceptance
                </span>
              </div>
            )}
          </div>

          {isLoggedIn ? (
            <div className="space-y-4">
              <div className="text-xs text-center text-color-slate font-medium">
                Accepting as <span className="font-bold text-color-ink">{session.user?.name}</span> ({session.user?.email})
              </div>
              <form action={handleAccept}>
                <Button type="submit" className="w-full font-bold h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs">
                  Accept and Join Workspace
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </form>
              
              {session.user?.email?.toLowerCase() !== invitation.email.toLowerCase() && (
                <p className="text-[11px] text-center text-amber-600 font-medium">
                  Note: Your current account email does not match the invitation email ({invitation.email}).
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-center text-color-slate font-medium mb-4">
                To accept this invitation, please log in or create a free Nexus account.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/?auth=register&callbackUrl=${encodeURIComponent(`/invite?token=${token}`)}`} className="flex-1">
                  <Button className="w-full font-bold h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs">
                    Sign up to join
                  </Button>
                </Link>
                <Link href={`/?auth=login&callbackUrl=${encodeURIComponent(`/invite?token=${token}`)}`} className="flex-1">
                  <Button variant="outline" className="w-full font-bold h-11 rounded-xl border-border/80 text-foreground hover:bg-muted/30">
                    Log in to accept
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
