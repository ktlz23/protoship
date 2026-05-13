#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerReadHtmlTool } from "./tools/read-html.js";
import { registerPrerequisitesTool } from "./tools/prerequisites.js";
import { registerWriteFilesTool } from "./tools/write-files.js";
import { registerReadProjectFilesTool } from "./tools/read-project-files.js";
import { registerGetStackTemplateTool } from "./tools/get-stack-template.js";
import { registerListProjectsTool } from "./tools/list-projects.js";

const server = new McpServer({
  name: "protoship",
  version: "0.2.0",
});

registerReadHtmlTool(server);
registerPrerequisitesTool(server);
registerWriteFilesTool(server);
registerReadProjectFilesTool(server);
registerGetStackTemplateTool(server);
registerListProjectsTool(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("POC Restructurer MCP server running");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
