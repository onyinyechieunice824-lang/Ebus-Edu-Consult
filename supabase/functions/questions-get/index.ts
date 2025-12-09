import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    const url = new URL(req.url);
    const subject = url.searchParams.get('subject');
    const examType = url.searchParams.get('examType');
    const count = parseInt(url.searchParams.get('count') || '40');

    if (!subject || !examType) {
      return new Response(
        JSON.stringify({ error: 'Missing subject or examType parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get questions for subject and exam type
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('subject', subject)
      .eq('exam_type', examType);

    if (error) {
      console.error('Query error:', error);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!questions || questions.length === 0) {
      // Return placeholder questions
      const placeholders = Array(count).fill(null).map((_, i) => ({
        id: `error-${subject}-${i}`,
        subject,
        exam_type: examType,
        text: `No ${examType} questions found for ${subject}. Please upload questions in Admin Panel.`,
        option_a: 'N/A',
        option_b: 'N/A',
        option_c: 'N/A',
        option_d: 'N/A',
        correct_option: 'A'
      }));

      return new Response(
        JSON.stringify({ questions: placeholders }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Shuffle and select random questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = [];
    
    // Recycle if not enough questions
    while (selected.length < count) {
      const needed = count - selected.length;
      const batch = shuffled.slice(0, needed);
      selected.push(...batch);
    }

    // Randomize options for each question
    const randomizedQuestions = selected.map(q => {
      const options = [
        { id: 'A', text: q.option_a },
        { id: 'B', text: q.option_b },
        { id: 'C', text: q.option_c },
        { id: 'D', text: q.option_d }
      ];
      
      const correctText = options.find(o => o.id === q.correct_option)?.text;
      const shuffledOpts = options.sort(() => Math.random() - 0.5);
      const newCorrectIndex = shuffledOpts.findIndex(o => o.text === correctText);
      const keys = ['A', 'B', 'C', 'D'];

      return {
        id: `${q.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        originalId: q.id,
        subject: q.subject,
        examType: q.exam_type,
        text: q.text,
        optionA: shuffledOpts[0].text,
        optionB: shuffledOpts[1].text,
        optionC: shuffledOpts[2].text,
        optionD: shuffledOpts[3].text,
        correctOption: keys[newCorrectIndex],
        explanation: q.explanation
      };
    });

    return new Response(
      JSON.stringify({ questions: randomizedQuestions }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get questions error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});