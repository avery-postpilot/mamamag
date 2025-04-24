import { createRouter, createWebHistory } from 'vue-router'
import { isAuthorizedUser } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import CampaignManager from '../views/CampaignManager.vue'
import CampaignForm from '../views/CampaignForm.vue'
import AuthCallback from '../views/AuthCallback.vue'
import PublicCampaigns from '../views/PublicCampaigns.vue'
import AssetDashboard from '../views/AssetDashboard.vue'
import CampaignLanding from '../views/CampaignLanding.vue'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: CampaignLanding
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
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthorizedUser()) {
    next('/')
  } else {
    next()
  }
})

export default router 