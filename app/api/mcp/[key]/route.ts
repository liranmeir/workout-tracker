import { timingSafeEqual } from "node:crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildMcpServer } from "@/lib/mcp";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// The secret lives in the URL path, so the connector works in claude.ai without OAuth.
function keyOk(key: string) {
  const secret = process.env.MCP_SECRET;
  if (!secret || secret.length < 24) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  if (!keyOk(key)) return new Response("Not found", { status: 404 });

  // Stateless: a fresh server + transport per request (fits serverless).
  const server = buildMcpServer();
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
