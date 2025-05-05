import { createRouter, createWebHistory } from 'vue-router'
import { isAuthorizedUser } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import CampaignManager from '../views/CampaignManager.vue'
import CampaignForm from '../views/CampaignForm.vue'
import AuthCallback from '../views/AuthCallback.vue'
import PublicCampaigns from '../views/PublicCampaigns.vue'
import AssetDashboard from '../views/AssetDashboard.vue'
import CampaignLanding from '../views/CampaignLanding.vue'
import BrandLookup from '../views/BrandLookup.vue'
import InviteCodeVerification from '../components/InviteCodeVerification.vue'
import InviteCodeAdmin from '../components/InviteCodeAdmin.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => {
      return Promise.resolve(isAuthorizedUser() ? CampaignLanding : InviteCodeVerification)
    }
  },
  {
    path: '/landing',
    name: 'landing',
    component: CampaignLanding,
    meta: { requiresInviteCode: true }
  },
  {
    path: '/campaign-manager',
    name: 'campaign-manager',
    component: CampaignManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/campaign/:id',
    name: 'campaign',
    component: CampaignForm,
    props: true
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: AuthCallback
  },
  {
    path: '/campaigns',
    name: 'PublicCampaigns',
    component: PublicCampaigns
  },
  {
    path: '/assets',
    name: 'asset-dashboard',
    component: AssetDashboard
  },
  {
    path: '/brands',
    name: 'brand-lookup',
    component: BrandLookup
  },
  {
    path: '/admin/invite-codes',
    name: 'invite-code-admin',
    component: InviteCodeAdmin,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  // Check for admin authentication
  if (to.meta.requiresAuth && !isAuthorizedUser()) {
    next('/')
    return
  }

  // Check for invite code
  if (to.meta.requiresInviteCode) {
    const encryptedInfo = sessionStorage.getItem('brandInfo')
    if (!encryptedInfo) {
      next('/')
      return
    }

    try {
      const brandInfo = JSON.parse(atob(encryptedInfo))
      // Check if session is expired (24 hours)
      if (Date.now() - brandInfo.timestamp > 24 * 60 * 60 * 1000) {
        sessionStorage.removeItem('brandInfo')
        next('/')
        return
      }
    } catch (err) {
      console.error('Error parsing brand info:', err)
      sessionStorage.removeItem('brandInfo')
      next('/')
      return
    }
  }

  next()
})

export default router 