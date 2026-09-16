import type { APIRoute } from 'astro';
import { buildLlmsFullTxt } from '../lib/llms';
import { absoluteUrl } from '../lib/url';

export const GET: APIRoute = () =>
  new Response(buildLlmsFullTxt(absoluteUrl), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
