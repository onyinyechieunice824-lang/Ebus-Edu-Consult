/*
  # CBT Portal Database Schema
  
  ## Overview
  Complete database schema for JAMB/WAEC CBT Practice Portal with authentication,
  question bank, exam sessions, and results tracking.

  ## New Tables
  
  ### 1. users
  Stores both students and administrators
  - `id` (uuid, PK) - Unique user identifier
  - `username` (text, unique) - Registration number for students, email for admin
  - `password_hash` (text) - Hashed password
  - `role` (text) - 'student' or 'admin'
  - `full_name` (text) - Full name of user
  - `reg_number` (text) - Registration/exam number
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### 2. questions
  Stores all exam questions for JAMB and WAEC
  - `id` (uuid, PK) - Question identifier
  - `exam_type` (text) - 'JAMB' or 'WAEC'
  - `subject` (text) - Subject name
  - `text` (text) - Question text
  - `option_a`, `option_b`, `option_c`, `option_d` (text) - Answer options
  - `correct_option` (text) - Correct answer ('A', 'B', 'C', or 'D')
  - `explanation` (text, optional) - Answer explanation
  - `is_default` (boolean) - System default vs custom questions
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 3. exam_sessions
  Tracks individual exam attempts
  - `id` (uuid, PK) - Session identifier
  - `user_id` (uuid, FK) - Reference to users table
  - `exam_type` (text) - 'JAMB' or 'WAEC'
  - `subjects` (jsonb) - Array of selected subjects
  - `start_time` (timestamptz) - Exam start time
  - `duration_seconds` (integer) - Total exam duration
  - `is_submitted` (boolean) - Submission status
  - `submitted_at` (timestamptz, optional) - Submission timestamp
  - `created_at` (timestamptz) - Record creation
  
  ### 4. session_answers
  Stores student answers during exam
  - `id` (uuid, PK) - Answer record identifier
  - `session_id` (uuid, FK) - Reference to exam_sessions
  - `question_id` (uuid, FK) - Reference to questions
  - `selected_option` (text) - Student's selected answer
  - `is_marked_for_review` (boolean) - Review flag
  - `answered_at` (timestamptz) - When answer was given
  
  ### 5. exam_results
  Stores final exam results
  - `id` (uuid, PK) - Result identifier
  - `user_id` (uuid, FK) - Reference to users
  - `session_id` (uuid, FK) - Reference to exam_sessions
  - `exam_type` (text) - 'JAMB' or 'WAEC'
  - `total_score` (integer) - Raw total score
  - `aggregate_score` (integer) - Normalized score (out of 400)
  - `subject_scores` (jsonb) - Detailed scores per subject
  - `completed_at` (timestamptz) - Completion time
  - `created_at` (timestamptz) - Record creation

  ## Security
  - Row Level Security enabled on all tables
  - Students can only access their own data
  - Admin has full access to manage all records
  - Public cannot access any data without authentication

  ## Important Notes
  - Default admin account must be created separately
  - Password hashing should be done at application level
  - Question randomization happens at application level
  - Session auto-save for resume functionality
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'admin')),
  full_name text NOT NULL,
  reg_number text,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type text NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC')),
  subject text NOT NULL,
  text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  explanation text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create exam_sessions table
CREATE TABLE IF NOT EXISTS exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_type text NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC')),
  subjects jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_time timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL,
  is_submitted boolean DEFAULT false,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create session_answers table
CREATE TABLE IF NOT EXISTS session_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option text CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_marked_for_review boolean DEFAULT false,
  answered_at timestamptz DEFAULT now(),
  UNIQUE(session_id, question_id)
);

-- Create exam_results table
CREATE TABLE IF NOT EXISTS exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  exam_type text NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC')),
  total_score integer NOT NULL DEFAULT 0,
  aggregate_score integer NOT NULL DEFAULT 0,
  subject_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_exam_subject ON questions(exam_type, subject);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_submitted ON exam_sessions(is_submitted);
CREATE INDEX IF NOT EXISTS idx_session_answers_session ON session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_question ON session_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_user ON exam_results(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_session ON exam_results(session_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Admin can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admin can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admin can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can update own password"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- RLS Policies for questions table
CREATE POLICY "Anyone authenticated can view questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admin can update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete custom questions"
  ON questions FOR DELETE
  TO authenticated
  USING (
    is_default = false AND
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- RLS Policies for exam_sessions table
CREATE POLICY "Users can view own sessions"
  ON exam_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all sessions"
  ON exam_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can create own sessions"
  ON exam_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON exam_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can delete sessions"
  ON exam_sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- RLS Policies for session_answers table
CREATE POLICY "Users can view own session answers"
  ON session_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_sessions es 
      WHERE es.id = session_answers.session_id 
      AND es.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all answers"
  ON session_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own answers"
  ON session_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_sessions es 
      WHERE es.id = session_answers.session_id 
      AND es.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own answers"
  ON session_answers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_sessions es 
      WHERE es.id = session_answers.session_id 
      AND es.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_sessions es 
      WHERE es.id = session_answers.session_id 
      AND es.user_id = auth.uid()
    )
  );

-- RLS Policies for exam_results table
CREATE POLICY "Users can view own results"
  ON exam_results FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all results"
  ON exam_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own results"
  ON exam_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can delete results"
  ON exam_results FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );