import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { adminUsername, questions } = await req.json();

    if (!adminUsername || !questions || !Array.isArray(questions)) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin
    const { data: admin } = await supabase
      .from('users')
      .select('role')
      .eq('username', adminUsername)
      .eq('role', 'admin')
      .maybeSingle();

    if (!admin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert questions (with deduplication check)
    const inserted = [];
    const skipped = [];

    for (const q of questions) {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('questions')
        .select('id')
        .eq('subject', q.subject)
        .eq('exam_type', q.examType)
        .eq('text', q.text.trim())
        .maybeSingle();

      if (existing) {
        skipped.push(q);
        continue;
      }

      // Insert question
      const { data, error } = await supabase
        .from('questions')
        .insert({
          exam_type: q.examType,
          subject: q.subject,
          text: q.text,
          option_a: q.optionA,
          option_b: q.optionB,
          option_c: q.optionC,
          option_d: q.optionD,
          correct_option: q.correctOption,
          explanation: q.explanation || null,
          is_default: false
        })
        .select()
        .single();

      if (!error && data) {
        inserted.push(data);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: inserted.length,
        skipped: skipped.length,
        total: questions.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Add questions error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});