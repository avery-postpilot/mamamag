import { signInWithGoogle, signOut, checkAuth } from '../supabase/auth'

export class AuthComponent {
  constructor() {
    this.authContainer = document.getElementById('auth-container')
    this.loginButton = document.getElementById('login-button')
    this.logoutButton = document.getElementById('logout-button')
    this.userInfo = document.getElementById('user-info')
    
    this.setupEventListeners()
    this.checkAuthStatus()
  }
  
  setupEventListeners() {
    if (this.loginButton) {
      this.loginButton.addEventListener('click', this.handleLogin)
    }
    
    if (this.logoutButton) {
      this.logoutButton.addEventListener('click', this.handleLogout)
    }
  }
  
  handleLogin = async () => {
    const { error } = await signInWithGoogle()
    if (error) {
      this.showError('Failed to sign in. Please try again.')
    }
  }
  
  handleLogout = async () => {
    const { error } = await signOut()
    if (error) {
      this.showError('Failed to sign out. Please try again.')
    } else {
      window.location.href = '/'
    }
  }
  
  async checkAuthStatus() {
    const { authenticated, session, error } = await checkAuth()
    
    if (error) {
      this.showError(error.message)
      return
    }
    
    if (authenticated && session) {
      this.showAuthenticatedUI(session.user)
    } else {
      this.showLoginUI()
    }
  }
  
  showAuthenticatedUI(user) {
    if (this.authContainer) {
      this.authContainer.innerHTML = `
        <div class="user-info">
          <img src="${user.user_metadata.avatar_url || ''}" alt="Profile" class="profile-pic">
          <span>${user.email}</span>
          <button id="logout-button" class="btn btn-secondary">Logout</button>
        </div>
      `
    }
  }
  
  showLoginUI() {
    if (this.authContainer) {
      this.authContainer.innerHTML = `
        <button id="login-button" class="btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
          Sign in with Google
        </button>
      `
    }
  }
  
  showError(message) {
    if (this.authContainer) {
      const errorDiv = document.createElement('div')
      errorDiv.className = 'error-message'
      errorDiv.textContent = message
      this.authContainer.appendChild(errorDiv)
    }
  }
} 