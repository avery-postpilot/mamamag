import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'

export const user = ref(null)
export const session = ref(null)

// Initialize the store with the current session
export async function init() {
  const { data } = await supabase.auth.getSession()
  session.value = data.session
  user.value = data.session?.user ?? null

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, _session) => {
    session.value = _session
    user.value = _session?.user ?? null
  })
}

// Sign in with Google
export async function signInWithGoogle() {
  // Determine if we're in production (Netlify) or development
  const isProduction = window.location.hostname.includes('netlify.app');
  const redirectUrl = isProduction 
    ? 'https://mamamag-manager.netlify.app/auth/callback'
    : `${window.location.protocol}//${window.location.hostname}:${window.location.port}/auth/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      redirectTo: redirectUrl
    }
  })
  if (error) throw error
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Check if user is authenticated and has an allowed email domain
export function isAuthorizedUser() {
  const email = user.value?.email ?? ''
  return email.endsWith('@postpilot.com') || email.endsWith('@gritgrowth.io')
} 