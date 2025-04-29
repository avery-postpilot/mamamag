<template>
  <div class="home">
    <header>
      <img src="../assets/mamamag-logo.svg" alt="MamaMag Logo">
      <h1>MamaMag Campaign Portal</h1>
    </header>

    <MagazinePreview class="preview-section" />
    
    <div class="content">
      <div v-if="!user" class="login-section">
        <h2>Welcome to MamaMag Campaign Portal</h2>
        <p>Please sign in with your PostPilot or Grit Growth email to access the campaign manager.</p>
        <button @click="handleLogin" class="login-button">
          Sign in with Google
        </button>
      </div>

      <div v-else-if="!isAuthorizedUser()" class="error-section">
        <h2>Access Restricted</h2>
        <p>Sorry, this portal is only accessible to PostPilot and Grit Growth employees.</p>
        <button @click="handleSignOut" class="logout-button">
          Sign Out
        </button>
      </div>

      <div v-else class="campaigns-section">
        <h2>Available Campaigns</h2>
        <!-- Campaign list will be added here -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { user, signInWithGoogle, signOut, isAuthorizedUser } from '../stores/auth'
import MagazinePreview from '../components/magazine/MagazinePreview.vue'

async function handleLogin() {
  try {
    await signInWithGoogle()
  } catch (error) {
    console.error('Error signing in:', error)
  }
}

async function handleSignOut() {
  try {
    await signOut()
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 40px;
}

header img {
  max-width: 200px;
  margin-bottom: 20px;
}

header h1 {
  color: #ff69b4;
  font-size: 2.5rem;
  margin: 0;
}

.preview-section {
  margin: 40px 0;
  text-align: center;
}

.content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
}

.login-button, .logout-button {
  background-color: #ff69b4;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover, .logout-button:hover {
  background-color: #ff45a1;
}

.error-section {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 20px;
  margin-top: 20px;
}
</style> 