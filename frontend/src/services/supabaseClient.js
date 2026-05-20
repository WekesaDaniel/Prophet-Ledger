// frontend/src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log for debugging (remove in production)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check:');
  console.error('- REACT_APP_SUPABASE_URL:', supabaseUrl ? 'Set' : 'MISSING');
  console.error('- REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'MISSING');
  
  // For development, show helpful message
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Supabase credentials missing. Please add them to your .env file');
    console.warn('Create a .env file in frontend/ with:');
    console.warn('REACT_APP_SUPABASE_URL=your_url');
    console.warn('REACT_APP_SUPABASE_ANON_KEY=your_key');
  }
}

// Validate before creating client
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase credentials are required. ' +
    'Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);