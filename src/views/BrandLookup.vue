<template>
  <div class="brand-lookup">
    <div class="header">
      <h1>Brand Lookup</h1>
      <div class="controls">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            placeholder="Search brands..." 
            @input="filterBrands"
          />
        </div>
        <div class="sort-controls">
          <select v-model="sortBy" @change="sortBrands">
            <option value="name">Name</option>
            <option value="campaignCount">Number of Campaigns</option>
            <option value="lastCampaign">Last Campaign Date</option>
          </select>
          <button @click="toggleSortOrder">
            {{ sortOrder === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
        <div class="selection-controls">
          <button class="select-all-btn" @click="selectAllBrands">
            {{ selectedBrands.size === filteredBrands.length ? 'Deselect All' : 'Select All' }}
          </button>
          <button 
            class="export-btn" 
            @click="exportToCSV"
            :disabled="selectedBrands.size === 0"
          >
            Export Selected Contacts ({{ selectedBrands.size }})
          </button>
        </div>
      </div>
    </div>

    <div class="brands-list">
      <div v-for="brand in filteredBrands" :key="brand.id" class="brand-card">
        <div class="brand-header">
          <div class="brand-select">
            <input 
              type="checkbox" 
              :checked="selectedBrands.has(brand.id)"
              @change="toggleBrandSelection(brand.id)"
            />
          </div>
          <h2>{{ brand.name }}</h2>
          <div class="contact-info">
            <p><strong>Contact:</strong> {{ brand.contactName }}</p>
            <p><strong>Email:</strong> {{ brand.contactEmail }}</p>
          </div>
        </div>

        <div class="campaign-history">
          <div class="campaign-header">
            <h3>Campaign History ({{ brand.campaigns?.length || 0 }})</h3>
            <button @click="toggleCampaigns(brand.id)">
              {{ expandedBrands.includes(brand.id) ? 'Hide' : 'Show' }}
            </button>
          </div>
          <div v-if="expandedBrands.includes(brand.id)" class="campaign-list">
            <div v-if="!brand.campaigns?.length" class="no-campaigns">
              No campaigns yet
            </div>
            <div v-else v-for="campaign in brand.campaigns" :key="campaign.id" class="campaign-item">
              <p><strong>{{ campaign.name }}</strong> - {{ formatDate(campaign.date) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabaseClient'
import { v5 as uuidv5 } from 'uuid'

const searchQuery = ref('')
const sortBy = ref('name')
const sortOrder = ref('asc')
const expandedBrands = ref([])
const submissions = ref([])
const selectedBrands = ref(new Set())

const fetchSubmissions = async () => {
  try {
    // First, get all submissions with their campaigns
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('campaign_submissions')
      .select(`
        id,
        brand_name,
        contact_name,
        contact_email,
        mailing_address,
        brand_logo_url,
        brand_url,
        campaigns (
          id,
          name,
          in_home_date
        )
      `)

    if (submissionsError) throw submissionsError

    // Create a map to store unique brands
    const brandMap = new Map()

    // Process each submission to create or update brand entries
    submissionsData.forEach(submission => {
      // Use combination of name and email as unique identifier for the map
      const mapKey = `${submission.brand_name}:${submission.contact_email}`.toLowerCase()
      
      if (!brandMap.has(mapKey)) {
        // Generate a deterministic UUID based on the brand name and email
        // This ensures the same brand always gets the same UUID
        const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8' // A fixed UUID namespace
        const brandId = uuidv5(mapKey, namespace)
        
        brandMap.set(mapKey, {
          id: brandId, // Use deterministic UUID for database operations
          name: submission.brand_name,
          contactName: submission.contact_name,
          contactEmail: submission.contact_email,
          mailingAddress: submission.mailing_address,
          brandUrl: submission.brand_url,
          logoUrl: submission.brand_logo_url,
          campaigns: []
        })
      }

      // Add campaign if it exists and isn't already added
      const brand = brandMap.get(mapKey)
      if (submission.campaigns) {
        const campaignExists = brand.campaigns.some(c => c.id === submission.campaigns.id)
        if (!campaignExists) {
          brand.campaigns.push({
            id: submission.campaigns.id,
            name: submission.campaigns.name,
            date: submission.campaigns.in_home_date
          })
        }
      }
    })

    // Convert the map to an array and sort brands by name
    submissions.value = Array.from(brandMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Error fetching submissions:', error)
  }
}

const filteredBrands = computed(() => {
  let result = [...submissions.value]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(brand => 
      brand.name.toLowerCase().includes(query) ||
      brand.contactName.toLowerCase().includes(query) ||
      brand.contactEmail.toLowerCase().includes(query)
    )
  }
  
  // Apply sorting
  result.sort((a, b) => {
    let comparison = 0
    if (sortBy.value === 'name') {
      comparison = a.name.localeCompare(b.name)
    } else if (sortBy.value === 'campaignCount') {
      comparison = a.campaigns.length - b.campaigns.length
    } else if (sortBy.value === 'lastCampaign') {
      const aDate = new Date(Math.max(...a.campaigns.map(c => new Date(c.date))))
      const bDate = new Date(Math.max(...b.campaigns.map(c => new Date(c.date))))
      comparison = aDate - bDate
    }
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
  
  return result
})

const toggleCampaigns = (brandId) => {
  const index = expandedBrands.value.indexOf(brandId)
  if (index === -1) {
    expandedBrands.value.push(brandId)
  } else {
    expandedBrands.value.splice(index, 1)
  }
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const formatDate = (date) => {
  return format(new Date(date), 'MMM d, yyyy')
}

const toggleBrandSelection = (brandId) => {
  if (selectedBrands.value.has(brandId)) {
    selectedBrands.value.delete(brandId)
  } else {
    selectedBrands.value.add(brandId)
  }
}

const selectAllBrands = () => {
  if (selectedBrands.value.size === filteredBrands.value.length) {
    selectedBrands.value.clear()
  } else {
    filteredBrands.value.forEach(brand => {
      selectedBrands.value.add(brand.id)
    })
  }
}

const exportToCSV = () => {
  const headers = ['Brand Name', 'Contact Name', 'Contact Email', 'Campaign Count']
  const csvContent = [
    headers.join(','),
    ...filteredBrands.value
      .filter(brand => selectedBrands.value.has(brand.id))
      .map(brand => [
        `"${brand.name}"`,
        `"${brand.contactName}"`,
        `"${brand.contactEmail}"`,
        brand.campaigns.length
      ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'brand_contacts.csv'
  link.click()
}

// Add debug logging
watch(submissions, (newVal) => {
  console.log('Brands loaded:', newVal.map(b => ({
    name: b.name,
    email: b.contactEmail,
    id: b.id,
    campaigns: b.campaigns.length
  })))
}, { deep: true })

onMounted(() => {
  fetchSubmissions()
})
</script>

<style scoped>
.brand-lookup {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

.sort-controls {
  display: flex;
  gap: 0.5rem;
}

.brand-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.brand-header {
  margin-bottom: 1rem;
}

.campaign-history, .notes-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.campaign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.note-item {
  background: #f8f9fa;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid #4CAF50;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.note-category {
  background: #e9ecef;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8rem;
}

.remove-note {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  line-height: 1;
}

.remove-note:hover {
  color: #c82333;
}

.add-note {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-note select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
}

.add-note textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.add-note-btn {
  padding: 0.5rem 1rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-note-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.add-note-btn:not(:disabled):hover {
  background: #45a049;
}

.export-btn {
  background: #2196F3;
}

.export-btn:hover {
  background: #1976D2;
}

.selection-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.select-all-btn {
  background: #6c757d;
}

.select-all-btn:hover {
  background: #5a6268;
}

.brand-select {
  margin-right: 1rem;
}

.brand-select input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.export-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.no-campaigns, .no-notes {
  color: #666;
  font-style: italic;
  padding: 0.5rem 0;
}

.campaign-item {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.note-item {
  background: #f8f9fa;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid #4CAF50;
}
</style> 