import { supabase } from './client'

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/campaign-manager.html`
    }
  })
  
  if (error) {
    console.error('Error signing in:', error)
    return { error }
  }
  
  return { data }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    return { error }
  }
  return { success: true }
}

export async function checkAuth() {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error checking auth:', error)
    return { error }
  }
  
  if (!session) {
    return { authenticated: false }
  }
  
  // Check if user has @postpilot.com email
  const email = session.user.email
  if (!email.endsWith('@postpilot.com')) {
    await signOut()
    return { authenticated: false, error: 'Unauthorized email domain' }
  }
  
  return { authenticated: true, session }
} 