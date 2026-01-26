import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';
import { getProfileTools, handleProfileTool } from './profiles.js';
import { getListTools, handleListTool } from './lists.js';

export function getAllTools(): Tool[] {
  return [
    ...getProfileTools(),
    ...getListTools(),
  ];
}

export async function handleToolCall(
  client: KlaviyoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  // Profile tools
  if (toolName.startsWith('klaviyo_profiles_')) {
    return handleProfileTool(client, toolName, args);
  }

  // List tools
  if (toolName.startsWith('klaviyo_lists_')) {
    return handleListTool(client, toolName, args);
  }

  throw new Error(`Unknown tool: ${toolName}`);
}
