/**
 * MCP Tools Index
 *
 * This file exports all MCP tools as an array for easy registration.
 * Each tool is a self-contained file that includes:
 * - GraphQL operation (picked up by codegen)
 * - Tool schema (zod)
 * - Tool handler implementation
 *
 * To add a new tool:
 * 1. Create a new file in this folder (e.g., my_new_tool.ts)
 * 2. Use createMcpTool() to define your tool with proper type inference
 * 3. Import and add it to the mcpTools array below
 */

import { listProjectsTool } from './list_projects';
import { listContactsTool } from './list_contacts';
import { listWorkspacesTool } from './list_workspaces';
import { braveSearchTool } from './brave_search';
import { updatePersonContactTool } from './update_person_contact';
import { updateBusinessContactTool } from './update_business_contact';
import { createPersonContactTool } from './create_person_contact';
import { createBusinessContactTool } from './create_business_contact';
import { searchPimTool } from './search_pim';
import { traversePimTool } from './traverse_pim';
import { listPricebooksTool } from './list_pricebooks';
import { createPricebookTool } from './create_pricebook';
import { listPricesTool } from './list_prices';
import { createRentalPriceTool } from './create_rental_price';
import { createSalePriceTool } from './create_sale_price';
import { searchPricesTool } from './search_prices';
import { updatePriceTool } from './update_price';
import { deletePriceTool } from './delete_price';
import { createResourceMapTagTool } from './create_resource_map_tag';
import { updateResourceMapTagTool } from './update_resource_map_tag';
import { deleteResourceMapTagTool } from './delete_resource_map_tag';
import { listResourceMapEntriesTool } from './list_resource_map_entries';
import { getResourceMapEntryTool } from './get_resource_map_entry';
import { listResourceMapEntriesByParentIdTool } from './list_resource_map_entries_by_parent_id';
import { listResourceMapEntriesByTagTypeTool } from './list_resource_map_entries_by_tag_type';
import { listResourceMapLocationTagsTool } from './list_resource_map_location_tags';
import type { McpTool } from './types';

export { createMcpTool, type McpTool } from './types';

/**
 * Array of all MCP tools to be registered with the server.
 * Add new tools here to automatically register them.
 *
 * Note: We use type assertion here because each tool has a specific
 * schema type, but we need to collect them in a homogeneous array.
 * The type safety is preserved in each individual tool definition.
 */
export const mcpTools: McpTool[] = [
  listProjectsTool,
  listContactsTool,
  listWorkspacesTool,
  braveSearchTool,
  updatePersonContactTool,
  updateBusinessContactTool,
  createPersonContactTool,
  createBusinessContactTool,
  searchPimTool,
  traversePimTool,
  listPricebooksTool,
  createPricebookTool,
  listPricesTool,
  createRentalPriceTool,
  createSalePriceTool,
  searchPricesTool,
  updatePriceTool,
  deletePriceTool,
  listResourceMapEntriesTool,
  getResourceMapEntryTool,
  listResourceMapEntriesByParentIdTool,
  listResourceMapEntriesByTagTypeTool,
  listResourceMapLocationTagsTool,
  createResourceMapTagTool,
  updateResourceMapTagTool,
  deleteResourceMapTagTool,
] as McpTool[];
