import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean old entries
  for (const [key, requests] of rateLimitMap.entries()) {
    if (requests[0] < windowStart) {
      rateLimitMap.delete(key);
    }
  }
  
  // Get current IP requests
  const requests = rateLimitMap.get(ip) || [];
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  
  if (!rateLimit(ip as string)) {
    return res.status(429).json({ 
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }

  try {
    // API Key authentication
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required',
        message: 'Please provide X-API-Key header'
      });
    }

    // Validate API key
    const { data: keyData, error: keyError } = await (supabase as any)
      .from('api_keys')
      .select('*')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is invalid or inactive'
      });
    }

    // Log API usage
    await (supabase as any)
      .from('api_usage_logs')
      .insert({
        api_key_id: keyData.id,
        method: req.method,
        endpoint: '/api/v1/projects',
        ip_address: ip,
        user_agent: req.headers['user-agent'],
        created_at: new Date().toISOString()
      });

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return handleGetProjects(req, res, keyData);
      case 'POST':
        return handleCreateProject(req, res, keyData);
      case 'PUT':
        return handleUpdateProject(req, res, keyData);
      case 'DELETE':
        return handleDeleteProject(req, res, keyData);
      default:
        return res.status(405).json({ 
          error: 'Method not allowed',
          message: 'Only GET, POST, PUT, DELETE methods are supported'
        });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
}

async function handleGetProjects(req: NextApiRequest, res: NextApiResponse, apiKeyData: any) {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      city,
      status = 'published',
      min_budget,
      max_budget,
      urgency,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Build query
    let query = (supabase as any)
      .from('projects')
      .select(`
        id, title, description, category, city, postal_code,
        estimated_budget_min, estimated_budget_max, urgency, status,
        created_at, updated_at, is_emergency, emergency_level,
        user_id,
        client:profiles!projects_user_id_fkey(full_name, avatar_url)
      `)
      .eq('status', status);

    // Apply filters
    if (category) query = query.eq('category', category);
    if (city) query = query.eq('city', city);
    if (urgency) query = query.eq('urgency', urgency);
    if (min_budget) query = query.gte('estimated_budget_min', min_budget);
    if (max_budget) query = query.lte('estimated_budget_max', max_budget);

    // Apply sorting
    query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

    // Apply pagination
    const offset = ((Number(page) - 1) * Number(limit));
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: projects, error } = await query;

    if (error) throw error;

    // Get total count for pagination
    const { count } = await (supabase as any)
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    return res.status(200).json({
      success: true,
      data: projects || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      },
      filters: {
        category,
        city,
        status,
        min_budget,
        max_budget,
        urgency,
        sort_by,
        sort_order
      }
    });

  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Failed to fetch projects',
      message: error.message 
    });
  }
}

async function handleCreateProject(req: NextApiRequest, res: NextApiResponse, apiKeyData: any) {
  try {
    const {
      title,
      description,
      category,
      city,
      postal_code,
      address,
      estimated_budget_min,
      estimated_budget_max,
      urgency = 'normal',
      work_types = [],
      photos = [],
      client_id
    } = req.body;

    // Validation
    if (!title || !description || !category || !city || !client_id) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'title, description, category, city, and client_id are required'
      });
    }

    // Create project
    const { data: project, error } = await (supabase as any)
      .from('projects')
      .insert({
        title,
        description,
        category,
        city,
        postal_code,
        address,
        estimated_budget_min: Number(estimated_budget_min) || 0,
        estimated_budget_max: Number(estimated_budget_max) || 0,
        urgency,
        work_types,
        photos,
        user_id: client_id,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger webhook for new project
    await triggerWebhook('project.created', {
      project,
      apiKey: apiKeyData.name
    });

    return res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });

  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Failed to create project',
      message: error.message 
    });
  }
}

async function handleUpdateProject(req: NextApiRequest, res: NextApiResponse, apiKeyData: any) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({ 
        error: 'Project ID required',
        message: 'Please provide project ID in query parameters'
      });
    }

    const { data: project, error } = await (supabase as any)
      .from('projects')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found',
        message: 'No project found with the provided ID'
      });
    }

    // Trigger webhook for project update
    await triggerWebhook('project.updated', {
      project,
      apiKey: apiKeyData.name
    });

    return res.status(200).json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });

  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Failed to update project',
      message: error.message 
    });
  }
}

async function handleDeleteProject(req: NextApiRequest, res: NextApiResponse, apiKeyData: any) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ 
        error: 'Project ID required',
        message: 'Please provide project ID in query parameters'
      });
    }

    const { data: project, error } = await (supabase as any)
      .from('projects')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found',
        message: 'No project found with the provided ID'
      });
    }

    // Trigger webhook for project deletion
    await triggerWebhook('project.deleted', {
      project,
      apiKey: apiKeyData.name
    });

    return res.status(200).json({
      success: true,
      data: project,
      message: 'Project deleted successfully'
    });

  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Failed to delete project',
      message: error.message 
    });
  }
}

async function triggerWebhook(event: string, data: any) {
  try {
    // Get active webhooks for this event
    const { data: webhooks } = await (supabase as any)
      .from('webhooks')
      .select('*')
      .eq('is_active', true)
      .eq('event', event);

    if (!webhooks || webhooks.length === 0) return;

    // Send webhook to each URL
    for (const webhook of webhooks) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': generateSignature(webhook.secret, JSON.stringify(data)),
            'X-Event-Type': event
          },
          body: JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString()
          })
        });

        // Log webhook delivery
        await (supabase as any)
          .from('webhook_deliveries')
          .insert({
            webhook_id: webhook.id,
            event,
            payload: JSON.stringify(data),
            status: response.ok ? 'delivered' : 'failed',
            response_status: response.status,
            response_body: response.ok ? null : await response.text(),
            created_at: new Date().toISOString()
          });

      } catch (error) {
        console.error(`Webhook delivery failed for ${webhook.url}:`, error);
      }
    }
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}

function generateSignature(secret: string, payload: string): string {
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}
