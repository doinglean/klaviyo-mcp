import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';

// Sort options for templates
const TEMPLATE_SORT_OPTIONS = [
  'created', '-created',
  'id', '-id',
  'name', '-name',
  'updated', '-updated',
];

// Available fields for templates
const TEMPLATE_FIELDS = [
  'name', 'editor_type', 'html', 'text',
  'created', 'updated',
];

export function getTemplateTools(): Tool[] {
  return [
    {
      name: 'klaviyo_templates_list',
      description: 'List all email templates with filtering, sorting, and pagination. Filter by name, editor type, and creation date.',
      inputSchema: {
        type: 'object',
        properties: {
          // Filters
          name: {
            type: 'string',
            description: 'Filter by exact template name',
          },
          name_contains: {
            type: 'string',
            description: 'Filter by partial template name (contains)',
          },
          id: {
            type: 'string',
            description: 'Filter by template ID',
          },
          editor_type: {
            type: 'string',
            enum: ['CODE', 'DRAG_AND_DROP', 'HYBRID'],
            description: 'Filter by editor type: CODE, DRAG_AND_DROP, or HYBRID',
          },
          created_after: {
            type: 'string',
            description: 'ISO 8601 datetime - filter templates created after',
          },
          created_before: {
            type: 'string',
            description: 'ISO 8601 datetime - filter templates created before',
          },
          updated_after: {
            type: 'string',
            description: 'ISO 8601 datetime - filter templates updated after',
          },
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for advanced filtering',
          },
          // Sort
          sort: {
            type: 'string',
            enum: TEMPLATE_SORT_OPTIONS,
            description: 'Sort field. Prefix with - for descending.',
          },
          // Sparse fieldsets
          fields_template: {
            type: 'array',
            items: { type: 'string', enum: TEMPLATE_FIELDS },
            description: 'Limit template fields returned',
          },
          // Pagination
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
        },
      },
    },
    {
      name: 'klaviyo_templates_get',
      description: 'Get a specific template by ID including its HTML and text content.',
      inputSchema: {
        type: 'object',
        properties: {
          template_id: {
            type: 'string',
            description: 'The Klaviyo template ID',
          },
          fields_template: {
            type: 'array',
            items: { type: 'string', enum: TEMPLATE_FIELDS },
            description: 'Limit template fields returned',
          },
        },
        required: ['template_id'],
      },
    },
    {
      name: 'klaviyo_templates_create',
      description: 'Create a new email template with HTML and/or text content.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the template (required)',
          },
          html: {
            type: 'string',
            description: 'HTML content for the template. Use Klaviyo template variables like {{ first_name }}',
          },
          text: {
            type: 'string',
            description: 'Plain text content for the template (fallback for non-HTML clients)',
          },
          editor_type: {
            type: 'string',
            enum: ['CODE', 'DRAG_AND_DROP', 'HYBRID'],
            description: 'Editor type (default: CODE)',
          },
        },
        required: ['name'],
      },
    },
    {
      name: 'klaviyo_templates_update',
      description: 'Update an existing template name, HTML content, or text content.',
      inputSchema: {
        type: 'object',
        properties: {
          template_id: {
            type: 'string',
            description: 'The Klaviyo template ID to update',
          },
          name: {
            type: 'string',
            description: 'New template name',
          },
          html: {
            type: 'string',
            description: 'Updated HTML content',
          },
          text: {
            type: 'string',
            description: 'Updated plain text content',
          },
        },
        required: ['template_id'],
      },
    },
    {
      name: 'klaviyo_templates_delete',
      description: 'Delete a template. This action cannot be undone.',
      inputSchema: {
        type: 'object',
        properties: {
          template_id: {
            type: 'string',
            description: 'The Klaviyo template ID to delete',
          },
        },
        required: ['template_id'],
      },
    },
    {
      name: 'klaviyo_templates_clone',
      description: 'Clone an existing template to create a copy with a new name.',
      inputSchema: {
        type: 'object',
        properties: {
          template_id: {
            type: 'string',
            description: 'The template ID to clone',
          },
          new_name: {
            type: 'string',
            description: 'Name for the cloned template (optional - will use original name + "Copy" if not provided)',
          },
        },
        required: ['template_id'],
      },
    },
    {
      name: 'klaviyo_templates_render',
      description: 'Render a template preview with sample context data. Useful for testing templates before sending.',
      inputSchema: {
        type: 'object',
        properties: {
          template_id: {
            type: 'string',
            description: 'The template ID to render',
          },
          context: {
            type: 'object',
            description: 'Context data for template variables (e.g., { "first_name": "John", "product_name": "Widget" })',
          },
        },
        required: ['template_id'],
      },
    },
    {
      name: 'klaviyo_templates_get_universal_content',
      description: 'Get universal content blocks for a template.',
      inputSchema: {
        type: 'object',
        properties: {
          template_id: {
            type: 'string',
            description: 'The Klaviyo template ID',
          },
          fields_universal_content: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit universal content fields returned',
          },
        },
        required: ['template_id'],
      },
    },
  ];
}

// Validation schemas
const listTemplatesSchema = z.object({
  name: z.string().optional(),
  name_contains: z.string().optional(),
  id: z.string().optional(),
  editor_type: z.enum(['CODE', 'DRAG_AND_DROP', 'HYBRID']).optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
  updated_after: z.string().optional(),
  filter: z.string().optional(),
  sort: z.string().optional(),
  fields_template: z.array(z.string()).optional(),
  page_cursor: z.string().optional(),
});

const getTemplateSchema = z.object({
  template_id: z.string(),
  fields_template: z.array(z.string()).optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  editor_type: z.enum(['CODE', 'DRAG_AND_DROP', 'HYBRID']).optional().default('CODE'),
});

const updateTemplateSchema = z.object({
  template_id: z.string(),
  name: z.string().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
});

const deleteTemplateSchema = z.object({
  template_id: z.string(),
});

const cloneTemplateSchema = z.object({
  template_id: z.string(),
  new_name: z.string().optional(),
});

const renderTemplateSchema = z.object({
  template_id: z.string(),
  context: z.record(z.unknown()).optional(),
});

const getTemplateUniversalContentSchema = z.object({
  template_id: z.string(),
  fields_universal_content: z.array(z.string()).optional(),
});

export async function handleTemplateTool(
  client: KlaviyoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case 'klaviyo_templates_list': {
      const input = listTemplatesSchema.parse(args);
      return client.listTemplates(input);
    }

    case 'klaviyo_templates_get': {
      const input = getTemplateSchema.parse(args);
      return client.getTemplate(input.template_id, {
        fields_template: input.fields_template,
      });
    }

    case 'klaviyo_templates_create': {
      const input = createTemplateSchema.parse(args);
      return client.createTemplate(input);
    }

    case 'klaviyo_templates_update': {
      const input = updateTemplateSchema.parse(args);
      const { template_id, ...updateData } = input;
      return client.updateTemplate(template_id, updateData);
    }

    case 'klaviyo_templates_delete': {
      const input = deleteTemplateSchema.parse(args);
      await client.deleteTemplate(input.template_id);
      return { success: true, message: `Template ${input.template_id} deleted successfully` };
    }

    case 'klaviyo_templates_clone': {
      const input = cloneTemplateSchema.parse(args);
      return client.cloneTemplate(input.template_id, input.new_name);
    }

    case 'klaviyo_templates_render': {
      const input = renderTemplateSchema.parse(args);
      return client.renderTemplate(input.template_id, input.context);
    }

    case 'klaviyo_templates_get_universal_content': {
      const input = getTemplateUniversalContentSchema.parse(args);
      return client.getTemplateUniversalContent(input.template_id, {
        fields_universal_content: input.fields_universal_content,
      });
    }

    default:
      throw new Error(`Unknown template tool: ${toolName}`);
  }
}
