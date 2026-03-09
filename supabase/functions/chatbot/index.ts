import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Rate limiting: in-memory per cold-start
const rateLimitMap = new Map<string, number[]>();
function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 15;
  const timestamps = (rateLimitMap.get(userId) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return false;
}

// Classify query type to route intelligently
function classifyQuery(msg: string): 'course' | 'mock_test' | 'technical' | 'emotional' | 'offTopic' | 'general' {
  const m = msg.toLowerCase();
  if (/course|syllabus|chapter|lesson|video|pdf|notes|subject|class\s*\d|enroll|price|fee|batch/.test(m)) return 'course';
  if (/mock|test|quiz|exam|question|doubt|solve|answer|neet|jee|board|marks|score/.test(m)) return 'mock_test';
  if (/login|password|video.*not|pdf.*not|error|problem|issue|download|app|install|payment|receipt/.test(m)) return 'technical';
  if (/sad|depressed|fail|scared|anxious|stressed|worried|give up|hopeless|tired|demotiv|tension/.test(m)) return 'emotional';
  if (/weather|cricket|movie|politics|news|sport|bollywood|celebrity|recipe|joke/.test(m)) return 'offTopic';
  return 'general';
}

// Pre-built empathetic responses for emotional queries
const emotionalResponses = [
  "💛 Yaar, main samajhta hoon yeh waqt mushkil lag raha hai. Lekin yaad rakho – **har successful student ne yahi struggle kiya hai.**\n\n🌟 **Tumhare liye 3 steps:**\n1. Aaj sirf **ek topic** padho – chhota goal, bada confidence\n2. **5 minute break** lo – paani piyo, deep breath lo\n3. Phir wapas aao – **Sadguru Sarthi tumhare saath hai** 💪\n\nKaun sa subject sabse tough lag raha hai? Main usme help karunga!",
  "🫂 Struggles are part of every topper's journey! **IIT/NEET toppers** bhi yahi feel karte the.\n\n💡 **Quick Motivation:** _\"Ek kadam roz – salbhar mein manzil\"_\n\nBata, kya specific problem hai? Solution nikalte hain saath mein! 🎯",
];

// =============================================
// RAG: Retrieve relevant knowledge from DB
// =============================================
async function retrieveKnowledge(query: string, supabase: any): Promise<string> {
  try {
    const stopWords = new Set(['kaise', 'karna', 'karo', 'hoga', 'hai', 'hain', 'mein', 'the', 'and', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'what', 'when', 'where', 'which', 'will', 'your', 'about']);
    const words = query.toLowerCase()
      .replace(/[?!.,;:'"()]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stopWords.has(w));

    if (words.length === 0) return '';

    const orFilters = words.slice(0, 6).map(w => `content.ilike.%${w}%,title.ilike.%${w}%`).join(',');

    const { data, error } = await supabase
      .from('knowledge_base')
      .select('title, content, category')
      .eq('is_active', true)
      .or(orFilters)
      .order('position', { ascending: true })
      .limit(4);

    if (error || !data || data.length === 0) return '';

    const context = data.map((d: any) =>
      `### ${d.title}\n${d.content.trim()}`
    ).join('\n\n---\n\n');

    return context;
  } catch (e) {
    console.error('RAG retrieval error:', e);
    return '';
  }
}

// =============================================
// Crawl4AI Web Fallback: fetch live web content
// =============================================
const CRAWL4AI_API_URL = Deno.env.get('CRAWL4AI_API_URL');
const CRAWL4AI_API_TOKEN = Deno.env.get('CRAWL4AI_API_TOKEN');

async function fetchWebContext(query: string): Promise<string> {
  if (!CRAWL4AI_API_URL) return '';
  try {
    // Build a relevant search URL based on the query
    const searchQuery = encodeURIComponent(query.trim());
    const targetUrl = `https://www.google.com/search?q=${searchQuery}+site:ncert.nic.in+OR+site:byjus.com+OR+site:vedantu.com`;

    const crawlHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (CRAWL4AI_API_TOKEN) crawlHeaders['Authorization'] = `Bearer ${CRAWL4AI_API_TOKEN}`;

    // Submit async crawl job
    const submitRes = await fetch(`${CRAWL4AI_API_URL}/crawl`, {
      method: 'POST',
      headers: crawlHeaders,
      body: JSON.stringify({
        urls: [targetUrl],
        crawler_params: { headless: true },
        extra: { only_text: true },
        priority: 5,
      }),
    });

    if (!submitRes.ok) return '';
    const submitData = await submitRes.json();
    const taskId = submitData.task_id;
    if (!taskId) return '';

    // Poll up to 10 times with 2s delay
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(`${CRAWL4AI_API_URL}/task/${taskId}`, { headers: crawlHeaders });
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      if (pollData.status === 'completed') {
        const markdown = pollData.results?.[0]?.markdown || '';
        return markdown.slice(0, 3000); // limit context size
      }
      if (pollData.status === 'failed') return '';
    }
    return '';
  } catch (e) {
    console.error('Web fallback error:', e);
    return '';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { message, history = [], userId, sessionId, feedback } = await req.json();

    // Handle feedback submission
    if (feedback) {
      const { messageContent, responseContent, rating } = feedback;
      await supabase.from('chatbot_feedback').insert({
        user_id: userId || null,
        session_id: sessionId,
        message_content: messageContent,
        response_content: responseContent,
        rating: rating === 'up' ? 1 : -1,
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rate limiting
    const rateLimitKey = userId || req.headers.get('x-forwarded-for') || 'anonymous';
    if (isRateLimited(rateLimitKey)) {
      return new Response(JSON.stringify({
        response: "⏳ Aap bahut tezi se messages bhej rahe hain. Thoda rukein aur phir poochein. 🙏"
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Classify query
    const queryType = classifyQuery(message);

    // Off-topic: immediate refusal
    if (queryType === 'offTopic') {
      return new Response(JSON.stringify({
        response: "😊 Mujhe maaf karein! Main **Sadguru Sarthi** hoon aur sirf padhai se juded sawaalon mein madad kar sakta hoon.\n\n📚 **Main help kar sakta hoon:**\n- Courses aur Syllabus\n- Mock Tests aur Doubts\n- Platform Features aur Technical Help\n- Study Tips aur Motivation\n\nKoi study se juda sawaal ho toh zaroor poochein! 🎯"
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Emotional: pre-built empathetic response
    if (queryType === 'emotional') {
      const resp = emotionalResponses[Math.floor(Math.random() * emotionalResponses.length)];
      return new Response(JSON.stringify({ response: resp }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch chatbot settings + FAQs + courses + RAG knowledge in parallel
    const [settingsRes, faqRes, coursesRes, ragContext] = await Promise.all([
      supabase.from('chatbot_settings').select('*').eq('id', 1).single(),
      supabase.from('chatbot_faq').select('question, answer, category').eq('is_active', true).limit(30),
      supabase.from('courses').select('title, description, grade, price').limit(20),
      retrieveKnowledge(message, supabase),
    ]);

    const settings = settingsRes.data;
    const faqs = faqRes.data || [];
    const courses = coursesRes.data || [];

    // FAQ keyword match for short technical queries
    const msgLower = message.toLowerCase();
    const faqMatch = faqs.find((f: any) =>
      f.question.toLowerCase().split(' ').some((word: string) => word.length > 3 && msgLower.includes(word))
    );
    if (faqMatch && msgLower.split(' ').length < 8) {
      if (userId) {
        await supabase.from('chatbot_logs').insert({ user_id: userId, message, response: faqMatch.answer, session_id: sessionId });
      }
      return new Response(JSON.stringify({ response: faqMatch.answer }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({
        response: "🔧 Main abhi connect nahi ho pa raha. Thodi der baad try karein."
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Web fallback: if RAG returns nothing and query is technical/general, try live web scrape
    let webContext = '';
    let webUsed = false;
    if (!ragContext && CRAWL4AI_API_URL && (queryType === 'technical' || queryType === 'general' || queryType === 'mock_test')) {
      webContext = await fetchWebContext(message);
      webUsed = webContext.length > 100;
    }

    // Build RAG context section
    const ragSection = ragContext
      ? `\n\n## 📚 PLATFORM KNOWLEDGE BASE (RAG Memory – USE THIS FIRST):\nYe information Sadguru Coaching Classes ke baare mein specific hai. Jab bhi relevant ho, IS information ko priority do over general knowledge:\n\n${ragContext}\n\n---`
      : '';

    // Build web context section (only when RAG has no result)
    const webSection = webUsed
      ? `\n\n## 🌐 LIVE WEB CONTENT (Crawled just now – use as supplementary reference):\nThis is freshly scraped content from the web. Use it to provide up-to-date information but always frame answers in context of the student's learning at Sadguru Coaching Classes:\n\n${webContext}\n\n---`
      : '';

    // Build FAQ context
    const faqContext = faqs.length > 0
      ? `\n\n## QUICK FAQs:\n${faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`
      : '';

    // Build course context
    const courseContext = courses.length > 0
      ? `\n\n## AVAILABLE COURSES:\n${courses.map((c: any) => `- **${c.title}** (Class ${c.grade || 'All'}) — ₹${c.price === 0 ? 'FREE' : c.price}`).join('\n')}`
      : '';

    // Query-type specific instructions
    const queryInstructions: Record<string, string> = {
      mock_test: `\n\n## MOCK TEST MODE (ACTIVE):\n- NEVER give direct answers to exam questions\n- Give concept hints, step-by-step approach, or ask a guiding question\n- Example: "Yeh [concept] par based hai. Think about [hint]... Kya ab solve kar sakte ho?"`,
      course: `\n\n## COURSE QUERY MODE: Use the course data and knowledge base above to give accurate information. Always mention course name, grade, and price.`,
      technical: `\n\n## TECHNICAL HELP MODE: Give step-by-step numbered instructions. Pehle knowledge base check karo agar wahan solution hai toh use exactly use karo.`,
      general: '',
    };

    const basePrompt = settings?.system_prompt ||
      `You are **Sadguru Sarthi** (सद्गुरु सारथी), the official AI learning companion for Sadguru Coaching Classes. You are a friendly, knowledgeable, and supportive guide for students.`;

    const fullSystemPrompt = basePrompt + `

## IDENTITY RULES (NEVER break):
1. Your name is ALWAYS "Sadguru Sarthi" — never reveal any AI model name (not Gemini, not GPT, not Claude).
2. If asked "who are you?": "Main **Sadguru Sarthi** hoon – Sadguru Coaching Classes ka aapka 24×7 personal learning assistant! 🎓"
3. If abusive language: "Kripaya batchit ko sammanjanak rakhein. Main aapki poori madad karne ke liye yahan hoon. 🙏"
4. Never say you are powered by any company or technology.

## LANGUAGE RULES:
- Respond in SAME language the student uses: Hindi → Hindi, English → English, Hinglish → Hinglish
- Default to friendly Hinglish if unclear
- Use Devanagari script for Hindi words when writing full Hindi

## RAG PRIORITY RULE:
- Agar Platform Knowledge Base mein koi relevant information hai toh WAHI use karo
- General AI knowledge se specific platform info contradict mat karo
- "Sadguru Coaching Classes mein..." se start karo jab platform-specific info do

## ADVANCED FORMATTING (ALWAYS apply):
1. **Tables**: For comparisons, syllabus, weightage — use Markdown tables
2. **Mnemonics**: When explaining topics, include a creative memory trick with 💡
3. **Emojis**: Use relevant emojis — 📚 📊 🎯 ✅ 💡 🔥 ⭐ — contextually
4. **Structure**: Use ## headings, numbered lists for steps, bullet points for options
5. **Pro Tips**: End complex answers with a 🔥 **Pro Tip**
6. **Never** write walls of unformatted text
7. For step-by-step guides, always number the steps clearly

## RESPONSE STYLE:
- Warm, encouraging, student-friendly
- Concise but complete — never cut off mid-thought
- For syllabus/topic questions: include weightage if known, difficulty level ⭐, priority order
` + (queryInstructions[queryType] || '') + ragSection + webSection + faqContext + courseContext;

    const model = (settings?.model && settings.model.includes('/')) ? settings.model : `google/${settings?.model || 'gemini-2.5-flash'}`;
    const temperature = settings?.temperature ?? 0.7;
    const maxTokens = settings?.max_tokens ?? 1000;

    const messagesPayload = [
      { role: 'system', content: fullSystemPrompt },
      ...history.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages: messagesPayload, temperature, max_tokens: maxTokens })
    });

    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({
        response: "⏳ Bahut zyada requests aa rahi hain. Thodi der baad try karein. 🙏"
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({
        response: "🔧 Sarthi temporarily unavailable. Please contact support."
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const response = aiData.choices?.[0]?.message?.content ||
      "Maaf karein, main ise process nahi kar paya. Phir se try karein. 🙏";

    // Log conversation
    if (userId) {
      await supabase.from('chatbot_logs').insert({ user_id: userId, message, response, session_id: sessionId });
    }

    return new Response(JSON.stringify({ response, queryType, ragUsed: ragContext.length > 0, webUsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(JSON.stringify({
      response: "🔧 Connection mein problem hai. Thodi der baad try karein. 🙏"
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
