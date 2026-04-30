import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.104.1';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://secretarialdesk.netlify.app';
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

type AnalyzeRequest = {
  jobId?: string;
  documentId?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { jobId, documentId } = await req.json() as AnalyzeRequest;
    if (!jobId || !documentId) {
      return jsonResponse({ error: 'jobId and documentId are required.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const authorization = req.headers.get('Authorization') || '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: 'Supabase service environment variables are missing.' }, 500);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } }
    });
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: allowedJob, error: allowedError } = await userClient
      .from('document_analysis_jobs')
      .select('id, document_id, analysis_type')
      .eq('id', jobId)
      .eq('document_id', documentId)
      .maybeSingle();

    if (allowedError || !allowedJob) {
      return jsonResponse({ error: 'You do not have access to this analysis job.' }, 403);
    }

    await supabase
      .from('document_analysis_jobs')
      .update({ status: 'analyzing', updated_at: new Date().toISOString(), error_message: null })
      .eq('id', jobId);

    if (!geminiApiKey && !anthropicApiKey) {
      const message = 'No AI provider is configured. Add GEMINI_API_KEY or ANTHROPIC_API_KEY to the Edge Function secrets.';
      await markFailed(supabase, jobId, documentId, message);
      return jsonResponse({ error: message }, 500);
    }

    const { data: documentRecord, error: documentError } = await supabase
      .from('documents')
      .select('id, file_path, original_filename')
      .eq('id', documentId)
      .single();

    if (documentError || !documentRecord?.file_path) {
      const message = documentError?.message || 'Document file path is missing.';
      await markFailed(supabase, jobId, documentId, message);
      return jsonResponse({ error: message }, 404);
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('company-documents')
      .download(documentRecord.file_path);

    if (downloadError || !fileData) {
      const message = downloadError?.message || 'Could not download document from storage.';
      await markFailed(supabase, jobId, documentId, message);
      return jsonResponse({ error: message }, 500);
    }

    if (fileData.size > MAX_FILE_BYTES) {
      const message = `Document exceeds maximum allowed size of ${MAX_FILE_BYTES / 1024 / 1024} MB.`;
      await markFailed(supabase, jobId, documentId, message);
      return jsonResponse({ error: message }, 413);
    }

    const base64 = await blobToBase64(fileData);
    const analysisType = allowedJob.analysis_type || 'company_onboarding';
    const safeFilename = (documentRecord.original_filename || 'company-document.pdf')
      .replace(/[^a-zA-Z0-9._\- ]/g, '')
      .slice(0, 100);
    const extracted = await analyzeDocument(base64, safeFilename, analysisType);

    await supabase
      .from('documents')
      .update({ status: 'review_required', extracted_data: extracted })
      .eq('id', documentId);

    const { data: job, error: updateError } = await supabase
      .from('document_analysis_jobs')
      .update({
        status: 'review_required',
        extracted_data: extracted,
        confidence_summary: extracted.confidenceSummary || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select('id, status, extracted_data, confidence_summary')
      .single();

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500);
    }

    return jsonResponse({ job });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unexpected analysis failure.' }, 500);
  }
});

function buildExtractionPrompt(filename: string, analysisType = 'company_onboarding') {
  if (analysisType === 'trust_deed') {
    return `You are extracting Trust Deed data for a South African beneficial ownership compliance app.
Return only valid JSON with this exact shape:
{
  "trust": {
    "name": "",
    "registrationNumber": "",
    "masterReference": ""
  },
  "trustees": [
    { "fullName": "", "idNumber": "", "ownershipPercentage": 0, "notes": "" }
  ],
  "beneficiaries": [
    { "fullName": "", "idNumber": "", "ownershipPercentage": 0, "notes": "" }
  ],
  "founders": [
    { "fullName": "", "idNumber": "", "ownershipPercentage": 0, "notes": "" }
  ],
  "controllers": [
    { "fullName": "", "idNumber": "", "ownershipPercentage": 0, "notes": "" }
  ],
  "warnings": [],
  "sourceNotes": [],
  "confidenceSummary": {
    "trust": "high|medium|low",
    "people": "high|medium|low",
    "notes": ""
  }
}
Use South African trust terminology. Extract only natural persons. Use 0 ownership where the person controls the trust but no fixed percentage is stated. Include clause/page references in notes when visible. Do not invent IDs, dates or names. Filename: ${filename}`;
  }

  return `You are extracting company onboarding data for a South African company secretarial compliance app.
Return only valid JSON with this exact shape:
{
  "company": {
    "name": "",
    "registrationNumber": "",
    "type": "Pty Ltd",
    "incorporationDate": "",
    "registeredAddress": ""
  },
  "directors": [
    { "fullName": "", "idNumber": "", "appointmentDate": "", "sourceNote": "" }
  ],
  "warnings": [],
  "sourceNotes": [],
  "confidenceSummary": {
    "company": "high|medium|low",
    "directors": "high|medium|low",
    "notes": ""
  }
}
Use South African terminology. Prefer CIPC registration numbers like 2020/123456/07. Leave fields blank when not present. Do not invent IDs, dates or names. Filename: ${filename}`;
}

async function analyzeDocument(pdfBase64: string, filename: string, analysisType = 'company_onboarding') {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  const failures: string[] = [];

  if (geminiApiKey) {
    try {
      const extracted = await analyzeWithGemini(geminiApiKey, pdfBase64, filename, analysisType);
      return {
        ...extracted,
        sourceNotes: [
          ...(Array.isArray(extracted.sourceNotes) ? extracted.sourceNotes : []),
          'AI provider: Gemini'
        ]
      };
    } catch (error) {
      failures.push(error instanceof Error ? error.message : 'Gemini analysis failed.');
    }
  }

  if (anthropicApiKey) {
    try {
      const extracted = await analyzeWithClaude(anthropicApiKey, pdfBase64, filename, analysisType);
      return {
        ...extracted,
        warnings: [
          ...(Array.isArray(extracted.warnings) ? extracted.warnings : []),
          ...(failures.length ? ['Gemini analysis failed; Claude fallback was used.'] : [])
        ],
        sourceNotes: [
          ...(Array.isArray(extracted.sourceNotes) ? extracted.sourceNotes : []),
          'AI provider: Claude'
        ]
      };
    } catch (error) {
      failures.push(error instanceof Error ? error.message : 'Claude analysis failed.');
    }
  }

  throw new Error(failures.length ? failures.join(' | ') : 'No configured AI provider could analyze the document.');
}

async function analyzeWithGemini(apiKey: string, pdfBase64: string, filename: string, analysisType = 'company_onboarding') {
  const prompt = buildExtractionPrompt(filename, analysisType);
  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash-lite';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'application/pdf', data: pdfBase64 } }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini analysis failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(stripJsonFence(text));
}

async function analyzeWithClaude(apiKey: string, pdfBase64: string, filename: string, analysisType = 'company_onboarding') {
  const prompt = buildExtractionPrompt(filename, analysisType);
  const model = Deno.env.get('ANTHROPIC_MODEL') || 'claude-sonnet-4-5';
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64
            },
            title: filename
          },
          { type: 'text', text: prompt }
        ]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude analysis failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  const text = result?.content?.find((part: { type?: string; text?: string }) => part.type === 'text')?.text || '{}';
  return JSON.parse(stripJsonFence(text));
}

function stripJsonFence(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');
}

async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function markFailed(supabase: ReturnType<typeof createClient>, jobId: string, documentId: string, message: string) {
  await supabase.from('document_analysis_jobs').update({
    status: 'failed',
    error_message: message,
    updated_at: new Date().toISOString()
  }).eq('id', jobId);
  await supabase.from('documents').update({ status: 'failed' }).eq('id', documentId);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
