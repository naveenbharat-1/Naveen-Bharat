import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CRAWL4AI_API_URL = Deno.env.get('CRAWL4AI_API_URL');
const CRAWL4AI_API_TOKEN = Deno.env.get('CRAWL4AI_API_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Poll for Crawl4AI async task result
async function pollTaskResult(taskId: string, maxAttempts = 15): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (CRAWL4AI_API_TOKEN) headers['Authorization'] = `Bearer ${CRAWL4AI_API_TOKEN}`;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000)); // 2s between polls
    const res = await fetch(`${CRAWL4AI_API_URL}/task/${taskId}`, { headers });
    if (!res.ok) continue;
    const data = await res.json();
    if (data.status === 'completed') return data;
    if (data.status === 'failed') throw new Error(`Crawl failed: ${data.error || 'Unknown error'}`);
  }
  throw new Error('Crawl timed out after 30 seconds');
}

// Split long content into manageable knowledge_base chunks
function splitIntoChunks(content: string, title: string, maxLen = 1500): Array<{ title: string; content: string }> {
  if (content.length <= maxLen) return [{ title, content }];
  const chunks: Array<{ title: string; content: string }> = [];
  const paragraphs = content.split(/\n\n+/);
  let current = '';
  let idx = 1;
  for (const para of paragraphs) {
    if ((current + para).length > maxLen && current.length > 0) {
      chunks.push({ title: `${title} (Part ${idx})`, content: current.trim() });
      current = para;
      idx++;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }
  if (current.trim()) chunks.push({ title: idx > 1 ? `${title} (Part ${idx})` : title, content: current.trim() });
  return chunks;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Validate admin via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!)
      .auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { url, mode = 'scrape', category = 'general' } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==========================================
    // SCRAPE-ONLY MODE: return markdown directly
    // ==========================================
    if (mode === 'scrape') {
      if (!CRAWL4AI_API_URL) {
        return new Response(JSON.stringify({
          error: 'CRAWL4AI_API_URL not configured. Please deploy Crawl4AI and set the secret.'
        }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const crawlHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (CRAWL4AI_API_TOKEN) crawlHeaders['Authorization'] = `Bearer ${CRAWL4AI_API_TOKEN}`;

      // Submit crawl job
      const submitRes = await fetch(`${CRAWL4AI_API_URL}/crawl`, {
        method: 'POST',
        headers: crawlHeaders,
        body: JSON.stringify({
          urls: [targetUrl.href],
          crawler_params: { headless: true },
          extra: { only_text: true },
          priority: 8,
        }),
      });

      if (!submitRes.ok) {
        const errText = await submitRes.text();
        throw new Error(`Crawl4AI submit error: ${submitRes.status} ${errText}`);
      }

      const submitData = await submitRes.json();
      const taskId = submitData.task_id;
      if (!taskId) throw new Error('No task_id returned from Crawl4AI');

      // Poll for result
      const result = await pollTaskResult(taskId);
      const crawlResult = result.results?.[0];
      const markdown = crawlResult?.markdown || crawlResult?.content || '';
      const pageTitle = crawlResult?.metadata?.title || targetUrl.hostname;

      return new Response(JSON.stringify({
        success: true,
        markdown: markdown.slice(0, 8000), // Limit for AI context injection
        title: pageTitle,
        url: targetUrl.href,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==========================================
    // INGEST MODE: scrape + save to knowledge_base
    // ==========================================
    if (mode === 'ingest') {
      // Record in history as pending
      const { data: historyRecord } = await supabase
        .from('crawl_history')
        .insert({
          url: targetUrl.href,
          status: 'pending',
          crawled_by: user.id,
        })
        .select()
        .single();

      const historyId = historyRecord?.id;

      try {
        if (!CRAWL4AI_API_URL) {
          // Update history as failed
          if (historyId) {
            await supabase.from('crawl_history').update({
              status: 'failed',
              error_message: 'CRAWL4AI_API_URL not configured',
            }).eq('id', historyId);
          }
          return new Response(JSON.stringify({
            error: 'CRAWL4AI_API_URL not configured. Please deploy Crawl4AI Docker and set the secret.',
            historyId,
          }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const crawlHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (CRAWL4AI_API_TOKEN) crawlHeaders['Authorization'] = `Bearer ${CRAWL4AI_API_TOKEN}`;

        // Submit crawl job
        const submitRes = await fetch(`${CRAWL4AI_API_URL}/crawl`, {
          method: 'POST',
          headers: crawlHeaders,
          body: JSON.stringify({
            urls: [targetUrl.href],
            crawler_params: { headless: true },
            extra: { only_text: true },
            priority: 8,
          }),
        });

        if (!submitRes.ok) {
          const errText = await submitRes.text();
          throw new Error(`Crawl4AI error: ${submitRes.status} ${errText}`);
        }

        const submitData = await submitRes.json();
        const taskId = submitData.task_id;
        if (!taskId) throw new Error('No task_id from Crawl4AI');

        // Poll for result
        const result = await pollTaskResult(taskId);
        const crawlResult = result.results?.[0];
        const markdown = crawlResult?.markdown || crawlResult?.content || '';
        const pageTitle = crawlResult?.metadata?.title || targetUrl.hostname;

        if (!markdown || markdown.length < 50) {
          throw new Error('Page returned empty or very short content. Try a different URL.');
        }

        // Split content into chunks and save to knowledge_base
        const chunks = splitIntoChunks(markdown, pageTitle);
        const kbEntries = chunks.map(chunk => ({
          title: chunk.title,
          content: chunk.content,
          category: category,
          keywords: [
            targetUrl.hostname.replace('www.', ''),
            ...pageTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 5),
          ],
          is_active: true,
          position: 999,
        }));

        const { data: insertedEntries, error: kbError } = await supabase
          .from('knowledge_base')
          .insert(kbEntries)
          .select('id');

        if (kbError) throw new Error(`DB insert error: ${kbError.message}`);

        const entriesCreated = insertedEntries?.length || 0;

        // Update history as completed
        if (historyId) {
          await supabase.from('crawl_history').update({
            status: 'completed',
            knowledge_entries_created: entriesCreated,
            title: pageTitle,
            content_preview: markdown.slice(0, 200),
          }).eq('id', historyId);
        }

        return new Response(JSON.stringify({
          success: true,
          title: pageTitle,
          entriesCreated,
          url: targetUrl.href,
          historyId,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (innerErr) {
        const errMsg = innerErr instanceof Error ? innerErr.message : String(innerErr);
        if (historyId) {
          await supabase.from('crawl_history').update({
            status: 'failed',
            error_message: errMsg,
          }).eq('id', historyId);
        }
        throw innerErr;
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid mode. Use "scrape" or "ingest"' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('crawl4ai-bridge error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
