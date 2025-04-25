<template>
  <div class="landing-container">
    <header>
      <img src="../assets/mamamag-logo.svg" alt="MamaMag Logo">
      <h1>Upcoming Campaigns</h1>
      <p>Reserve your spot in our upcoming issues</p>
      <button @click="handleAdminLogin" class="admin-login-btn">
        Admin Sign In
      </button>
    </header>

    <div v-if="loading" class="loader">
      <div class="spinner"></div>
      <p>Loading campaigns...</p>
    </div>

    <div v-else-if="error" class="message error">
      {{ error }}
    </div>

    <div v-else-if="!campaigns.length" class="message info">
      No upcoming campaigns available at this time.
    </div>

    <div v-else class="campaigns-grid">
      <div v-for="campaign in campaigns" 
           :key="campaign.id" 
           class="campaign-card"
           @click="navigateToCampaign(campaign.id)">
        <div class="campaign-header">
          <h2>{{ campaign.name }}</h2>
          <span class="campaign-status" :class="{ 'active': isCampaignActive(campaign) }">
            {{ isCampaignActive(campaign) ? 'Open for Reservations' : 'Coming Soon' }}
          </span>
        </div>
        
        <div class="campaign-details">
          <div class="detail-item">
            <span class="label">Distribution:</span>
            <span class="value">{{ formatNumber(campaign.volume) }} copies</span>
          </div>
          <div class="detail-item">
            <span class="label">In-Home Date:</span>
            <span class="value">{{ formatDate(campaign.in_home_date) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Asset Due Date:</span>
            <span class="value">{{ formatDate(campaign.asset_due_date) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Available Pages:</span>
            <span class="value">{{ getAvailablePages(campaign) }} of {{ campaign.page_count }}</span>
          </div>
        </div>

        <div class="campaign-cta">
          <button class="btn" :disabled="!isCampaignActive(campaign)">
            {{ isCampaignActive(campaign) ? 'Reserve Your Spot' : 'Coming Soon' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { signInWithGoogle } from '@/stores/auth'

export default {
  name: 'CampaignLanding',
  setup() {
    const router = useRouter()
    const campaigns = ref([])
    const loading = ref(true)
    const error = ref(null)

    const handleAdminLogin = async () => {
      try {
        await signInWithGoogle()
      } catch (error) {
        console.error('Error signing in:', error)
      }
    }

    const loadCampaigns = async () => {
      try {
        loading.value = true
        error.value = null

        // Get current date in ISO format
        const currentDate = new Date().toISOString()

        // Fetch campaigns where asset due date hasn't passed
        const { data, error: err } = await supabase
          .from('campaigns')
          .select(`
            *,
            campaign_submissions(
              id,
              selected_pages
            )
          `)
          .gte('asset_due_date', currentDate)
          .order('in_home_date', { ascending: true })

        if (err) throw err

        campaigns.value = data || []
      } catch (err) {
        console.error('Error loading campaigns:', err)
        error.value = 'Failed to load campaigns. Please try again later.'
      } finally {
        loading.value = false
      }
    }

    const isCampaignActive = (campaign) => {
      const currentDate = new Date()
      const assetDueDate = new Date(campaign.asset_due_date)
      return currentDate < assetDueDate
    }

    const getAvailablePages = (campaign) => {
      if (!campaign.campaign_submissions) return campaign.page_count
      
      const reservedPages = new Set()
      campaign.campaign_submissions.forEach(submission => {
        if (submission.selected_pages) {
          submission.selected_pages.forEach(page => {
            if (page.page_id) reservedPages.add(page.page_id)
          })
        }
      })
      
      return campaign.page_count - reservedPages.size
    }

    const formatDate = (date) => {
      if (!date) return 'No date set'
      try {
        const dateObj = new Date(date)
        if (isNaN(dateObj.getTime())) return 'Invalid Date'
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } catch (err) {
        console.error('Date formatting error:', err)
        return 'Invalid Date'
      }
    }

    const formatNumber = (num) => {
      if (num === null || num === undefined) return '0'
      return num.toLocaleString('en-US')
    }

    const navigateToCampaign = (campaignId) => {
      router.push(`/campaign/${campaignId}`)
    }

    onMounted(() => {
      loadCampaigns()
    })

    return {
      campaigns,
      loading,
      error,
      isCampaignActive,
      getAvailablePages,
      formatDate,
      formatNumber,
      navigateToCampaign,
      handleAdminLogin
    }
  }
}
</script>

<style lang="scss" scoped>
.landing-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  text-align: center;
  margin-bottom: 3rem;
  
  img {
    max-width: 250px;
    margin-bottom: 1rem;
  }
  
  h1 {
    color: var(--primary-color);
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #666;
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  .admin-login-btn {
    background-color: #ff69b4;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-top: 1rem;

    &:hover {
      background-color: #ff45a1;
    }
  }
}

.campaigns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.campaign-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .campaign-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;

    h2 {
      color: #333;
      font-size: 1.5rem;
      margin: 0;
      flex: 1;
    }

    .campaign-status {
      background: #f0f0f0;
      color: #666;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;

      &.active {
        background: #e8f5e9;
        color: #2e7d32;
      }
    }
  }

  .campaign-details {
    margin-bottom: 1.5rem;

    .detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-size: 0.95rem;

      .label {
        color: #666;
      }

      .value {
        font-weight: 500;
        color: #333;
      }
    }
  }

  .campaign-cta {
    text-align: center;

    .btn {
      width: 100%;
      padding: 0.75rem;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 5px;
      background: var(--primary-color);
      color: white;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover:not(:disabled) {
        background: #ff45a1;
      }

      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    }
  }
}

.loader {
  text-align: center;
  padding: 2rem;

  .spinner {
    border: 5px solid #f3f3f3;
    border-top: 5px solid var(--primary-color);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
}

.message {
  text-align: center;
  padding: 2rem;
  border-radius: 8px;
  margin: 2rem 0;

  &.error {
    background: #ffebee;
    color: #c62828;
  }

  &.info {
    background: #e3f2fd;
    color: #1565c0;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .landing-container {
    padding: 1rem;
  }

  .campaigns-grid {
    grid-template-columns: 1fr;
  }
}
</style> 