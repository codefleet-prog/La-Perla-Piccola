const SUPABASE_URL = 'https://cmuzhrlydzdekdkhsqfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtdXpocmx5ZHpkZWtka2hzcWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MDMzOTYsImV4cCI6MjA5NzE3OTM5Nn0.VAxeCHl_fj3Y7LCMbI08oLW6P0FzzQEYrIZ2pDj9ZOY';

// Initialize the Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
