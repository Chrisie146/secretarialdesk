import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.104.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
      .select('id, document_id')
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

    if (!geminiApiKey) {
      await markFailed(supabase, jobId, documentId, 'GEMINI_API_KEY is not configured for the Edge Function.');
      return jsonResponse({ error: 'GEMINI_API_KEY is not configured for the Edge Function.' }, 500);
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

    const base64 = await blobToBase64(fileData);
    const extracted = await analyzeWithGemini(geminiApiKey, base64, documentRecord.original_filename || 'company-document.pdf');

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

async function analyzeWithGemini(apiKey: string, pdfBase64: string, filename: string) {
  const prompt = `You are extracting company onboarding data for a South African company secretarial compliance app.
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

  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-1.5-flash';
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
