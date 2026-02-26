import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://dkeyvjscseuiihiodjqz.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_wRNdG0f-j8Oo0eiDhqA9qg_f0Gh1OQE';

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configure OAuth flow
    flowType: 'pkce',
  },
});

// Google OAuth configuration
export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '709918879424-4841f75e6vqnotbgcmo5ehnfakv8ep7i.apps.googleusercontent.com',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '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',
  // Redirect to our backend callback, which will handle the session
  redirectTo: process.env.SUPABASE_REDIRECT_URL || 'http://localhost:5000/auth/callback',
};

// Get the redirect URL based on environment
export const getSupabaseRedirectUrl = (): string => {
  if (process.env.VERCEL === '1') {
    // Vercel deployment
    return `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://metb-todo.vercel.app'}/auth/callback`;
  }
  if (process.env.RENDER_URL) {
    return `${process.env.RENDER_URL}/auth/callback`;
  }
  return 'http://localhost:5173/auth/callback';
};

// Helper to sign in with Google using Supabase
export const signInWithGoogle = async (): Promise<{ data: any; error: any }> => {
  const redirectUrl = getSupabaseRedirectUrl();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      scopes: 'email profile openid',
      // Store additional data for after callback
      skipBrowserRedirect: false,
    },
  });

  return { data, error };
};

// Helper to exchange code for session (for custom OAuth callback)
export const exchangeCodeForSession = async (code: string): Promise<{ data: any; error: any }> => {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  return { data, error };
};

// Helper to get current user
export const getCurrentUser = async (): Promise<{ user: User | null; error: any }> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user: user || null, error };
};

// Helper to sign out
export const signOut = async (): Promise<{ error: any }> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Helper to get session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

// Check if email exists in Supabase
export const checkEmailInSupabase = async (email: string): Promise<boolean> => {
  // Try to find user by email - we can't directly query by email in Supabase Auth
  // So we try to sign in with a dummy password or use admin API
  // For now, we'll check if we can get user by email using admin (server-side only)
  return false; // Will be implemented properly
};

export default supabase;
