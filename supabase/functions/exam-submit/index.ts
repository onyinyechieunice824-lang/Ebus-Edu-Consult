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

    const { sessionId, userId, questions, answers } = await req.json();

    if (!sessionId || !userId || !questions || !answers) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update session as submitted
    const { error: sessionError } = await supabase
      .from('exam_sessions')
      .update({ is_submitted: true, submitted_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (sessionError) {
      console.error('Session update error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit exam' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate results
    let totalScore = 0;
    let totalPossible = 0;
    const subjectScores: any = {};

    // Group questions by subject
    const questionsBySubject: any = {};
    Object.values(questions).forEach((subjectQuestions: any) => {
      subjectQuestions.forEach((q: any) => {
        if (!questionsBySubject[q.subject]) {
          questionsBySubject[q.subject] = [];
        }
        questionsBySubject[q.subject].push(q);
      });
    });

    // Calculate scores per subject
    for (const [subject, subjectQuestions] of Object.entries(questionsBySubject)) {
      let subScore = 0;
      const qs = subjectQuestions as any[];
      
      qs.forEach(q => {
        if (answers[q.id] === q.correctOption) {
          subScore++;
        }
      });
      
      subjectScores[subject] = { score: subScore, total: qs.length };
      totalScore += subScore;
      totalPossible += qs.length;
    }

    // Calculate aggregate score (normalized to 400)
    const aggregateScore = Math.round((totalScore / totalPossible) * 400);

    // Get session data to determine exam type
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('exam_type')
      .eq('id', sessionId)
      .single();

    // Insert result
    const { data: result, error: resultError } = await supabase
      .from('exam_results')
      .insert({
        user_id: userId,
        session_id: sessionId,
        exam_type: session?.exam_type || 'JAMB',
        total_score: totalScore,
        aggregate_score: aggregateScore,
        subject_scores: subjectScores
      })
      .select()
      .single();

    if (resultError) {
      console.error('Result insert error:', resultError);
      return new Response(
        JSON.stringify({ error: 'Failed to save result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: {
          id: result.id,
          totalScore,
          aggregateScore,
          subjectScores,
          timestamp: result.completed_at
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Submit exam error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});