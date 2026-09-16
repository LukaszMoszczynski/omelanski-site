import type { APIRoute } from 'astro';
import { buildLlmsTxt } from '../lib/llms';
import { absoluteUrl } from '../lib/url';

export const GET: APIRoute = () =>
  new Response(buildLlmsTxt(absoluteUrl), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
