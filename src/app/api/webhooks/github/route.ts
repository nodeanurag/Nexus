import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId query parameter" }, { status: 400 });
    }

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const payload = await request.json();

    // Check if it is a GitHub push event (contains commits)
    const commits = payload.commits || [];
    const branch = payload.ref ? payload.ref.replace("refs/heads/", "") : "main";
    const repoName = payload.repository?.full_name || "Repository";
    const headCommit = payload.head_commit;

    if (commits.length === 0) {
      return NextResponse.json({ message: "No commits to log" });
    }

    // Try to find actor by email from head commit
    const committerEmail = headCommit?.author?.email;
    let actorId = workspace.ownerId; // Fallback to workspace owner

    if (committerEmail) {
      const user = await db.user.findUnique({
        where: { email: committerEmail },
      });
      if (user) {
        actorId = user.id;
      }
    }

    const commitMessages = commits.map((c: any) => c.message).join("; ");
    const shortHash = headCommit?.id ? headCommit.id.slice(0, 7) : "commit";

    // Write to ActivityLog
    await db.activityLog.create({
      data: {
        workspaceId,
        actorId,
        action: "GITHUB_PUSH",
        entityType: "Repository",
        entityId: repoName,
        metadata: {
          name: repoName,
          commitsCount: commits.length,
          branch,
          repoName,
          commitMessages,
          headCommitHash: shortHash,
          committerName: headCommit?.author?.name || payload.sender?.login || "Git",
        },
      },
    });

    return NextResponse.json({ ok: true, logged: commits.length });
  } catch (error: any) {
    console.error("[github-webhook] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
