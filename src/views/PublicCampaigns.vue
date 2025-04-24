<template>
  <div class="public-campaigns">
    <header>
      <img src="../assets/mamamag-logo.svg" alt="MamaMag Logo">
      <h1>Available Campaigns</h1>
    </header>

    <div class="campaigns-grid">
      <div v-if="loading" class="loading">
        Loading campaigns...
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <div v-else class="campaign-cards">
        <div v-for="campaign in campaigns" :key="campaign.id" class="campaign-card">
          <h2>{{ campaign.name }}</h2>
          <div class="campaign-details">
            <p><strong>In-Home Date:</strong> {{ formatDate(campaign.inHomeDate) }}</p>
            <p><strong>Volume:</strong> {{ campaign.volume }}</p>
            <p><strong>Audience:</strong> {{ campaign.audience }}</p>
            <p><strong>Page Count:</strong> {{ campaign.pageCount }}</p>
          </div>
          <router-link :to="'/campaign/' + campaign.id" class="submit-button">
            Submit Assets
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'

const campaigns = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const { data, error: err } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .order('inHomeDate', { ascending: true })

    if (err) throw err
    campaigns.value = data
  } catch (err) {
    error.value = 'Error loading campaigns. Please try again later.'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
})

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.public-campaigns {
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
  color: var(--primary-color);
  font-size: 2.5rem;
  margin: 0;
}

.campaigns-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.campaign-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: transform 0.2s;
}

.campaign-card:hover {
  transform: translateY(-2px);
}

.campaign-card h2 {
  color: var(--primary-color);
  margin-bottom: 15px;
}

.campaign-details {
  margin-bottom: 20px;
}

.campaign-details p {
  margin: 8px 0;
}

.submit-button {
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.3s;
}

.submit-button:hover {
  background-color: var(--primary-hover);
}

.loading, .error {
  text-align: center;
  padding: 40px;
  font-size: 1.2rem;
}

.error {
  color: #721c24;
  background-color: #f8d7da;
  border-radius: 4px;
}
</style> 