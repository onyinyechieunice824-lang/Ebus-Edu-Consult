import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

    const { adminUsername, studentUsername } = await req.json();

    if (!adminUsername || !studentUsername) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // Get student user ID
    const { data: student } = await supabase
      .from('users')
      .select('id')
      .eq('username', studentUsername)
      .eq('role', 'student')
      .maybeSingle();

    if (!student) {
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete all results for this student (cascades to sessions and answers)
    const { error } = await supabase
      .from('exam_results')
      .delete()
      .eq('user_id', student.id);

    if (error) {
      console.error('Delete error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to clear results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also delete any unsubmitted sessions
    await supabase
      .from('exam_sessions')
      .delete()
      .eq('user_id', student.id)
      .eq('is_submitted', false);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Clear results error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});