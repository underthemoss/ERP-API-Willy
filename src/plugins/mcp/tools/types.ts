import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Sdk } from '../generated/graphql';
import { z } from 'zod';

/**
 * Utility type to infer the TypeScript type from a Zod schema shape.
 */
export type InferFromShape<T extends Record<string, z.ZodTypeAny>> = {
  [K in keyof T]: z.infer<T[K]>;
};

/**
 * Common interface for all MCP tools.
 * Each tool file should export an object conforming to this interface.
 */
export interface McpTool<
  T extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>,
> {
  /**
   * The name of the tool (must be unique).
   * Convention: snake_case matching the filename.
   */
  name: string;

  /**
   * Human-readable description of what the tool does.
   */
  description: string;

  /**
   * Zod schema defining the input parameters.
   * Use an empty object {} for tools with no parameters.
   */
  inputSchema: T;

  /**
   * The handler function that executes the tool.
   * @param sdk - The typed GraphQL SDK for making API calls
   * @param args - The validated input arguments
   * @returns A promise resolving to the MCP CallToolResult
   */
  handler: (sdk: Sdk, args: InferFromShape<T>) => Promise<CallToolResult>;

  /**
   * Validates incoming data against the tool's input schema.
   * @param data - The raw input data to validate
   * @returns The validated and typed input arguments
   * @throws ZodError if validation fails
   */
  validateInput: (data: unknown) => InferFromShape<T>;
}

/**
 * Factory function to create an MCP tool with proper type inference.
 * This is necessary because TypeScript cannot infer generics from object literals.
 * Automatically adds a validateInput function that uses Zod to validate incoming data.
 */
export function createMcpTool<T extends Record<string, z.ZodTypeAny>>(
  tool: Omit<McpTool<T>, 'validateInput'>,
): McpTool<T> {
  const schema = z.object(tool.inputSchema);
  return {
    ...tool,
    validateInput: (data: unknown): InferFromShape<T> => {
      return schema.parse(data) as InferFromShape<T>;
    },
  };
}
