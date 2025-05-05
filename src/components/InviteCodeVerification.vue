<template>
  <div class="invite-verification-container">
    <div class="content-wrapper">
      <!-- Logo Section -->
      <div class="logo-section">
        <router-link to="/">
          <img src="../assets/mamamag-logo.svg" alt="MamaMag Logo" class="logo">
        </router-link>
        <h1>Welcome to MamaMag</h1>
        <p>Your premier destination for luxury brand advertising</p>
      </div>

      <!-- Invite Code Section -->
      <div class="invite-code-section">
        <h2>Enter Your Invite Code</h2>
        <form @submit.prevent="verifyCode">
          <div class="input-group">
            <label for="invite-code" class="sr-only">Invite Code</label>
            <input
              id="invite-code"
              v-model="inviteCode"
              name="invite-code"
              type="text"
              required
              placeholder="Enter your invite code"
            />
          </div>

          <div class="button-group">
            <button type="submit" class="verify-button">
              Verify Code
            </button>
          </div>
        </form>

        <div v-if="error" class="error-message">
          {{ error }}
          <p>
            Need an invite code? Email <a href="mailto:avery@postpilot">avery@postpilot</a>
          </p>
        </div>
      </div>

      <!-- Admin Section -->
      <div class="admin-section">
        <button @click="handleAdminLogin" class="admin-button">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
          Admin Sign In
        </button>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <p>&copy; {{ new Date().getFullYear() }} MamaMag. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import { signInWithGoogle } from '../stores/auth'

const router = useRouter()
const inviteCode = ref('')
const error = ref('')

const handleAdminLogin = async () => {
  try {
    await signInWithGoogle()
  } catch (error) {
    console.error('Error signing in:', error)
  }
}

const verifyCode = async () => {
  try {
    const { data, error: verifyError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('invite_code', inviteCode.value)
      .single()

    if (verifyError) throw verifyError

    if (data) {
      // Update last accessed timestamp
      await supabase
        .from('invite_codes')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', data.id)

      // Store brand info in sessionStorage with encryption
      const brandInfo = {
        brandName: data.brand_name,
        inviteCode: data.invite_code,
        timestamp: Date.now()
      }
      
      // Simple encryption (in production, use a more robust encryption method)
      const encryptedInfo = btoa(JSON.stringify(brandInfo))
      sessionStorage.setItem('brandInfo', encryptedInfo)

      // Redirect to landing page
      router.push('/landing')
    } else {
      error.value = 'Invalid invite code. Please try again.'
    }
  } catch (err) {
    error.value = 'An error occurred. Please try again.'
    console.error('Error verifying code:', err)
  }
}
</script>

<style scoped>
.invite-verification-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, #fdf2f8, #ffffff);
  padding: 2rem 1rem;
}

.content-wrapper {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

.logo-section {
  margin-bottom: 2rem;
}

.logo {
  width: auto;
  height: 80px;
  margin: 0 auto 1rem;
}

.logo-section h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.logo-section p {
  font-size: 1.125rem;
  color: #4a5568;
}

.invite-code-section {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.invite-code-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 1rem;
}

.input-group {
  margin-bottom: 1rem;
}

.input-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #1a202c;
  transition: all 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #ff69b4;
  box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.1);
}

.verify-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.verify-button:hover {
  background-color: #ff45a1;
}

.error-message {
  margin-top: 1rem;
  color: #e53e3e;
  font-size: 0.875rem;
}

.error-message a {
  color: #ff69b4;
  text-decoration: none;
  font-weight: 500;
}

.error-message a:hover {
  text-decoration: underline;
}

.admin-section {
  margin-top: 1.5rem;
}

.admin-button {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #fdf2f8;
  color: #ff69b4;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.admin-button:hover {
  background-color: #fce7f3;
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.5rem;
}

.footer {
  margin-top: 2rem;
  text-align: center;
  color: #718096;
  font-size: 0.875rem;
}

/* Make sure the sr-only class is properly defined */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style> 