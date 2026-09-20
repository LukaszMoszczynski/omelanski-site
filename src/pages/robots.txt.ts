import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url';

const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'];

export const GET: APIRoute = () => {
  // The GitHub Pages preview must not be crawled at all (see PREVIEW in README).
  if (process.env.PREVIEW === '1') {
    return new Response(`User-agent: *
Disallow: /
`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    // Listed explicitly so the intent is clear; delete a block to opt a bot out.
    ...AI_BOTS.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
    `Sitemap: ${absoluteUrl('/sitemap-index.xml')}`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
