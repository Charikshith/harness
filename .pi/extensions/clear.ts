import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { unlinkSync } from "node:fs";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("clear", {
    description: "Clear conversation and start new session",
    handler: async (_args, ctx) => {
      // Grab the current session file before switching
      const oldSessionFile = ctx.sessionManager.getSessionFile();

      const result = await ctx.newSession();
      if (result.cancelled) {
        return "Session clear cancelled.";
      }

      // Delete the old session file so /resume won't show it
      if (oldSessionFile) {
        try {
          unlinkSync(oldSessionFile);
        } catch {
          // File may already be gone — that's fine
        }
      }

      return "Session cleared. Start typing to begin a new conversation.";
    }
  });
}
