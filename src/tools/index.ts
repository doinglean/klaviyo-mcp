import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';
import { getProfileTools, handleProfileTool } from './profiles.js';
import { getListTools, handleListTool } from './lists.js';
import { getCampaignTools, handleCampaignTool } from './campaigns.js';
import { getEventTools, handleEventTool } from './events.js';
import { getMetricTools, handleMetricTool } from './metrics.js';

export function getAllTools(): Tool[] {
  return [
    ...getProfileTools(),
    ...getListTools(),
    ...getCampaignTools(),
    ...getEventTools(),
    ...getMetricTools(),
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

  // Campaign tools
  if (toolName.startsWith('klaviyo_campaigns_')) {
    return handleCampaignTool(client, toolName, args);
  }

  // Event tools
  if (toolName.startsWith('klaviyo_events_')) {
    return handleEventTool(client, toolName, args);
  }

  // Metric tools
  if (toolName.startsWith('klaviyo_metrics_')) {
    return handleMetricTool(client, toolName, args);
  }

  throw new Error(`Unknown tool: ${toolName}`);
}
