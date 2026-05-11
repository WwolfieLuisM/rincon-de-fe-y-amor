const SUPABASE_URL = 'https://qktdrlhdzfefjwhxqjws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdGRybGhkemZlZmp3aHhxandzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTgzNjcsImV4cCI6MjA5NDAzNDM2N30.6vhmJQUtyQENxfBkxKl-dqWYTPEv_fMo2qPS2wzpdwQ';
const { createClient } = supabase;
window.supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
