/**
 * Minimal in-memory MCP client for unit tests.
 *
 * Uses the SDK's own `InMemoryTransport.createLinkedPair()`, so a test speaks
 * to the real server over the real protocol: the same initialize handshake,
 * the same schema validation, the same result envelopes a Claude Desktop or
 * Codex client would see. Only the wire is in-process.
 */

import { InMemoryTransport, type McpServer } from "@modelcontextprotocol/server";

export interface JsonRpcResponse {
  readonly jsonrpc: "2.0";
  readonly id: number;
  readonly result?: Record<string, unknown>;
  readonly error?: { readonly code: number; readonly message: string };
}

export interface ToolCallResult {
  readonly content?: readonly { readonly type: string; readonly text?: string }[];
  readonly isError?: boolean;
}

export interface InMemoryMcpClient {
  readonly request: (
    method: string,
    params?: Record<string, unknown>,
  ) => Promise<JsonRpcResponse>;
  readonly callTool: (
    name: string,
    args?: Record<string, unknown>,
  ) => Promise<ToolCallResult>;
  readonly callToolJson: (
    name: string,
    args?: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  readonly close: () => Promise<void>;
}

const REQUEST_TIMEOUT_MS = 10_000;

export async function connectInMemoryClient(
  server: McpServer,
): Promise<InMemoryMcpClient> {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const pending = new Map<number, (message: JsonRpcResponse) => void>();
  clientTransport.onmessage = (message) => {
    const envelope = message as unknown as JsonRpcResponse;
    const resolve = pending.get(envelope.id);
    if (resolve) {
      pending.delete(envelope.id);
      resolve(envelope);
    }
  };
  await clientTransport.start();

  let nextId = 0;
  const request = (
    method: string,
    params: Record<string, unknown> = {},
  ): Promise<JsonRpcResponse> => {
    const id = ++nextId;
    return new Promise<JsonRpcResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`MCP request "${method}" timed out.`));
      }, REQUEST_TIMEOUT_MS);
      pending.set(id, (message) => {
        clearTimeout(timer);
        resolve(message);
      });
      clientTransport
        .send({ jsonrpc: "2.0", id, method, params })
        .catch((error: unknown) => {
          clearTimeout(timer);
          pending.delete(id);
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
  };

  const initialize = await request("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "loehrning-unit-test", version: "1.0.0" },
  });
  if (initialize.error) {
    throw new Error(`initialize failed: ${initialize.error.message}`);
  }
  await clientTransport.send({
    jsonrpc: "2.0",
    method: "notifications/initialized",
  });

  const callTool = async (
    name: string,
    args: Record<string, unknown> = {},
  ): Promise<ToolCallResult> => {
    const response = await request("tools/call", { name, arguments: args });
    if (response.error) {
      throw new Error(`tools/call ${name} failed: ${response.error.message}`);
    }
    return response.result as unknown as ToolCallResult;
  };

  return {
    request,
    callTool,
    callToolJson: async (name, args) => {
      const result = await callTool(name, args);
      const text = result.content?.[0]?.text ?? "{}";
      return JSON.parse(text) as Record<string, unknown>;
    },
    close: async () => {
      await server.close();
    },
  };
}
