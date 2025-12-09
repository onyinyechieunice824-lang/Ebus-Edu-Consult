import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const SUBJECTS = [
  'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 
  'Economics', 'Government', 'Literature', 'CRS', 'Agricultural Science',
  'Geography', 'Commerce', 'Financial Accounting', 'Civic Education',
  'Further Mathematics', 'History'
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const adminUsername = url.searchParams.get('adminUsername');

    if (!adminUsername) {
      return new Response(
        JSON.stringify({ error: 'Missing adminUsername parameter' }),
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

    // Get all questions
    const { data: questions, error } = await supabase
      .from('questions')
      .select('subject, exam_type');

    if (error) {
      console.error('Query error:', error);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build stats object
    const stats: any = {};
    
    SUBJECTS.forEach(subject => {
      const subjectQuestions = questions?.filter(q => q.subject === subject) || [];
      stats[subject] = {
        JAMB: subjectQuestions.filter(q => q.exam_type === 'JAMB').length,
        WAEC: subjectQuestions.filter(q => q.exam_type === 'WAEC').length
      };
    });

    return new Response(
      JSON.stringify({ stats }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get stats error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});