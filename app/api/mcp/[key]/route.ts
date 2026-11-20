import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildMcpServer } from "@/lib/mcp";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { userForMcpKey } from "@/lib/users";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// The secret lives in the URL path, so the connector works in claude.ai without OAuth.
// Each user has their own secret (MCP_SECRET_<USERNAME>), which decides whose data the server sees.
async function handle(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  if (key.length < 24) return new Response("Not found", { status: 404 });
  const user = userForMcpKey(key, await db().select({ id: users.id, username: users.username, name: users.name }).from(users));
  if (!user) return new Response("Not found", { status: 404 });

  // Stateless: a fresh server + transport per request (fits serverless).
  const server = buildMcpServer(user);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    void transport.close();
    void server.close();
  }
}

export { handle as GET, handle as POST, handle as DELETE };
