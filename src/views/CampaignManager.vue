<template>
  <div class="campaign-manager">
    <header>
      <img src="../assets/mamamag-logo.svg" alt="MamaMag Logo">
      <h1>MamaMag Campaign Manager</h1>
      <p>Create and manage your MamaMag campaigns</p>
    </header>

    <div class="card" v-if="!showNewCampaignForm">
      <h2>My Campaigns</h2>
      <p>View and manage your existing campaigns or create a new one.</p>

      <div class="btn-group top-actions">
        <button class="btn" @click="showNewCampaignForm = true">
          Create New Campaign
        </button>
      </div>

      <div v-if="loading" class="loading">
        Loading campaigns...
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <div v-else>
        <table>
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>In-Home Date</th>
              <th>Volume</th>
              <th>Pages</th>
              <th>Pages Filled</th>
              <th>Design Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="campaign in campaigns" :key="campaign.id">
              <td>{{ campaign.name }}</td>
              <td>{{ formatDate(campaign.inHomeDate) }}</td>
              <td>{{ formatNumber(campaign.volume) }}</td>
              <td>{{ campaign.pageCount }}</td>
              <td>
                <div>{{ filledPagesCounts[campaign.id] || 0 }}/{{ campaign.pageCount }}</div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: ((filledPagesCounts[campaign.id] || 0) / campaign.pageCount * 100) + '%' }"
                  ></div>
                </div>
              </td>
              <td>{{ formatDate(calculateBusinessDays(campaign.assetDueDate, 5)) }}</td>
              <td>
                <button @click="editCampaign(campaign)" class="btn btn-secondary">
                  Edit
                </button>
                <button @click="viewCampaignForm(campaign.id)" class="btn">
                  View Form
                </button>
                <button @click="showBrands(campaign)" class="btn">
                  View Brands
                </button>
                <button @click="copyContactEmails(campaign.id)" class="btn btn-secondary">
                  Copy Emails
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Campaign Form -->
    <div class="card" v-else>
      <h2>{{ editingCampaign ? 'Edit Campaign' : 'Create New Campaign' }}</h2>
      
      <form @submit.prevent="saveCampaign">
        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <label for="campaign-name" class="required">Campaign Name</label>
              <input 
                id="campaign-name"
                v-model="campaignForm.name"
                placeholder="e.g. Summer 2025 - Beach Essentials"
                required
              >
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <label for="campaign-id" class="required">Campaign ID</label>
              <input 
                id="campaign-id"
                v-model="campaignForm.id"
                placeholder="e.g. MM-SU25"
                required
              >
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <label for="in-home-date" class="required">In-Home Date</label>
              <input 
                type="date"
                id="in-home-date"
                v-model="campaignForm.inHomeDate"
                required
              >
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <label for="volume" class="required">Volume</label>
              <input 
                type="number"
                id="volume"
                v-model="campaignForm.volume"
                placeholder="e.g. 50000"
                required
              >
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="audience" class="required">Target Audience</label>
          <input 
            id="audience"
            v-model="campaignForm.audience"
            placeholder="e.g. New moms in their third trimester"
            required
          >
        </div>

        <div class="form-group">
          <label for="asset-due-date" class="required">Asset Submission Due Date</label>
          <input 
            type="date"
            id="asset-due-date"
            v-model="campaignForm.assetDueDate"
            required
          >
        </div>

        <div class="form-group">
          <label for="page-count" class="required">Total Pages</label>
          <select 
            id="page-count"
            v-model="campaignForm.pageCount"
            required
          >
            <option value="">Select Page Count</option>
            <option value="16">16 Pages</option>
            <option value="20">20 Pages</option>
            <option value="24">24 Pages</option>
            <option value="28">28 Pages</option>
            <option value="32">32 Pages</option>
            <option value="36">36 Pages</option>
          </select>
        </div>

        <h3>Pricing Configuration</h3>
        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <label for="front-cover-price" class="required">Front Cover Price ($)</label>
              <input 
                type="number"
                id="front-cover-price"
                v-model="campaignForm.pricing.frontCover"
                placeholder="e.g. 10000"
                required
              >
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <label for="front-inside-cover-price" class="required">Front Inside Cover Price ($)</label>
              <input 
                type="number"
                id="front-inside-cover-price"
                v-model="campaignForm.pricing.frontInsideCover"
                placeholder="e.g. 8000"
                required
              >
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <label for="toc-placement-price" class="required">TOC Product Placement Price ($)</label>
              <input 
                type="number"
                id="toc-placement-price"
                v-model="campaignForm.pricing.tocPlacement"
                placeholder="e.g. 6000"
                required
              >
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <label for="standard-page-price" class="required">Standard Page Price ($)</label>
              <input 
                type="number"
                id="standard-page-price"
                v-model="campaignForm.pricing.standardPage"
                placeholder="e.g. 5000"
                required
              >
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <label for="center-spread-price" class="required">Center Spread Price ($)</label>
              <input 
                type="number"
                id="center-spread-price"
                v-model="campaignForm.pricing.centerSpread"
                placeholder="e.g. 12000"
                required
              >
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <label for="back-inside-cover-price" class="required">Back Inside Cover Price ($)</label>
              <input 
                type="number"
                id="back-inside-cover-price"
                v-model="campaignForm.pricing.backInsideCover"
                placeholder="e.g. 8000"
                required
              >
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <label for="back-cover-price" class="required">Back Cover Price ($)</label>
              <input 
                type="number"
                id="back-cover-price"
                v-model="campaignForm.pricing.backCover"
                placeholder="e.g. 9000"
                required
              >
            </div>
          </div>
        </div>

        <h3>Existing Brands</h3>
        <div id="existing-brands-container">
          <div v-for="(brand, index) in campaignForm.existingBrands" :key="index" class="form-row existing-brand-row">
            <div class="form-col">
              <div class="form-group">
                <label>Brand Name</label>
                <input 
                  v-model="brand.name"
                  placeholder="Brand name"
                  class="existing-brand-name"
                >
              </div>
            </div>
            <div class="form-col">
              <div class="form-group">
                <label>Reserved Pages</label>
                <select v-model="brand.reservedPages" multiple class="existing-brand-pages">
                  <option value="front-cover">Front Cover</option>
                  <option value="back-cover">Back Cover</option>
                  <option value="front-inside-cover">Front Inside Cover</option>
                  <option value="back-inside-cover">Back Inside Cover</option>
                  <option value="standard-page">Standard Page</option>
                  <option value="center-spread">Center Spread</option>
                  <option value="toc-product-placement">Table of Contents Product Placement</option>
                </select>
              </div>
            </div>
            <div class="form-col">
              <div class="form-group">
                <label>Total Cost ($)</label>
                <input 
                  type="number"
                  v-model="brand.totalCost"
                  min="0"
                  step="100"
                  class="existing-brand-cost"
                >
              </div>
            </div>
            <div class="form-col">
              <div class="form-group">
                <label>&nbsp;</label>
                <button 
                  type="button"
                  class="btn btn-secondary remove-brand-btn"
                  @click="removeBrand(index)"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="button"
          class="btn btn-secondary"
          @click="addExistingBrand"
        >
          + Add Existing Brand
        </button>

        <div class="form-group">
          <label for="campaign-description">Campaign Description</label>
          <textarea 
            id="campaign-description"
            v-model="campaignForm.description"
            rows="3"
            placeholder="Describe your campaign"
          ></textarea>
        </div>

        <div class="btn-group">
          <button 
            type="button"
            class="btn btn-secondary"
            @click="cancelEdit"
          >
            Cancel
          </button>
          <button type="submit" class="btn">
            {{ editingCampaign ? 'Update Campaign' : 'Save Campaign' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Brands Modal -->
    <div class="modal" v-if="showBrandsModal" @click="closeBrandsModal">
      <div class="modal-content" @click.stop>
        <span class="modal-close" @click="closeBrandsModal">&times;</span>
        <h2>Campaign Submissions</h2>
        <div id="brands-list">
          <div v-if="!modalSubmissions.length" class="no-submissions">
            No submissions yet
          </div>
          <div v-for="submission in modalSubmissions" :key="submission.id" class="brand-item">
            <h3>{{ submission.brand_name }}</h3>
            <p><strong>Contact:</strong> {{ submission.contact_name }}</p>
            <p><strong>Email:</strong> {{ submission.contact_email }}</p>
            <p><strong>Pages Selected:</strong></p>
            <ul class="pages-list">
              <li v-for="page in submission.selected_pages" :key="page.page_id">
                Page {{ page.page_id }} - {{ page.layout }}
              </li>
            </ul>
          </div>
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
const showNewCampaignForm = ref(false)
const editingCampaign = ref(null)
const showBrandsModal = ref(false)
const selectedCampaign = ref(null)
const filledPagesCounts = ref({})
const modalSubmissions = ref([])

const defaultCampaignForm = {
  id: '',
  name: '',
  description: '',
  inHomeDate: '',
  assetDueDate: '',
  volume: '',
  audience: '',
  pageCount: '',
  pricing: {
    frontCover: '',
    backCover: '',
    frontInsideCover: '',
    backInsideCover: '',
    standardPage: '',
    centerSpread: '',
    tocPlacement: ''
  },
  existingBrands: [],
  status: 'active'
}

const campaignForm = ref({ ...defaultCampaignForm })

onMounted(async () => {
  await loadCampaigns()
})

async function loadCampaigns() {
  try {
    console.log('Loading campaigns...')
    const { data, error: err } = await supabase
      .from('campaigns')
      .select('*')
      .order('in_home_date', { ascending: true })

    if (err) {
      console.error('Supabase error:', err)
      throw err
    }
    
    console.log('Campaigns loaded:', data)
    campaigns.value = data.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      inHomeDate: campaign.in_home_date,
      assetDueDate: campaign.asset_due_date,
      volume: campaign.volume,
      audience: campaign.audience,
      pageCount: campaign.page_count,
      pricing: campaign.pricing,
      existingBrands: campaign.existing_brands,
      status: campaign.status,
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at
    }))

    // Load filled pages counts for all campaigns
    await Promise.all(campaigns.value.map(async campaign => {
      const count = await getFilledPagesCount(campaign)
      filledPagesCounts.value[campaign.id] = count
    }))
  } catch (err) {
    console.error('Detailed error:', err)
    error.value = `Error loading campaigns: ${err.message || 'Please try again later.'}`
  } finally {
    loading.value = false
  }
}

function editCampaign(campaign) {
  editingCampaign.value = campaign
  campaignForm.value = {
    ...campaign,
    existingBrands: campaign.existingBrands || []
  }
  showNewCampaignForm.value = true
}

async function saveCampaign() {
  try {
    loading.value = true
    error.value = null

    const campaignData = {
      name: campaignForm.value.name,
      description: campaignForm.value.description,
      in_home_date: campaignForm.value.inHomeDate,
      asset_due_date: campaignForm.value.assetDueDate,
      volume: parseInt(campaignForm.value.volume),
      audience: campaignForm.value.audience,
      page_count: parseInt(campaignForm.value.pageCount),
      pricing: campaignForm.value.pricing,
      existing_brands: campaignForm.value.existingBrands,
      status: 'draft'
    }

    let campaignId
    if (editingCampaign.value) {
      const { data, error: updateError } = await supabase
        .from('campaigns')
        .update(campaignData)
        .eq('id', editingCampaign.value.id)
        .select()
        .single()

      if (updateError) throw updateError
      campaignId = data.id
    } else {
      const { data, error: insertError } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single()

      if (insertError) throw insertError
      campaignId = data.id
    }

    // Handle existing brand reservations
    if (campaignForm.value.existingBrands && campaignForm.value.existingBrands.length > 0) {
      for (const brand of campaignForm.value.existingBrands) {
        if (!brand.name || !brand.reservedPages || brand.reservedPages.length === 0) {
          console.warn('Skipping invalid brand reservation:', brand)
          continue
        }

        const reservationSubmissions = brand.reservedPages.map(page => ({
          campaign_id: campaignId,
          brand_name: brand.name,
          contact_name: 'Reserved',
          contact_email: 'reserved@mamamag.com',
          mailing_address: 'Reserved',
          brand_logo_url: null,
          brand_url: null,
          selected_pages: [{
            page_id: page,
            layout: 'reserved',
            product_name: 'Reserved',
            product_description: 'Reserved',
            product_price: 0,
            image_url: null,
            price: parseFloat(brand.totalCost) || 0
          }],
          total_price: parseFloat(brand.totalCost) || 0
        }))

        const { error: submissionError } = await supabase
          .from('campaign_submissions')
          .insert(reservationSubmissions)

        if (submissionError) {
          console.error('Submission error for brand:', brand.name, submissionError)
          throw submissionError
        }
      }
    }

    await loadCampaigns()
    cancelEdit()
  } catch (err) {
    error.value = 'Error saving campaign: ' + err.message
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}

function cancelEdit() {
  showNewCampaignForm.value = false
  editingCampaign.value = null
  campaignForm.value = { ...defaultCampaignForm }
}

function addExistingBrand() {
  campaignForm.value.existingBrands.push({
    name: '',
    reservedPages: [],
    totalCost: ''
  })
}

function removeBrand(index) {
  if (campaignForm.value.existingBrands.length > 1) {
    campaignForm.value.existingBrands.splice(index, 1)
  }
}

async function showBrands(campaign) {
  try {
    selectedCampaign.value = campaign
    showBrandsModal.value = true
    
    const { data, error } = await supabase
      .from('campaign_submissions')
      .select('*')
      .eq('campaign_id', campaign.id)
    
    if (error) throw error
    
    modalSubmissions.value = data
  } catch (err) {
    console.error('Error loading submissions:', err)
    alert('Failed to load submissions')
  }
}

function closeBrandsModal() {
  showBrandsModal.value = false
  selectedCampaign.value = null
  modalSubmissions.value = []
}

function viewCampaignForm(campaignId) {
  if (!campaignId) {
    console.error('No campaign ID provided')
    return
  }
  console.log('Opening campaign form for ID:', campaignId)
  window.open(`/campaign/${campaignId}`, '_blank')
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num)
}

function calculateBusinessDays(startDate, daysToAdd) {
  const date = new Date(startDate)
  let count = 0
  while (count < daysToAdd) {
    date.setDate(date.getDate() + 1)
    if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
      count++
    }
  }
  return date
}

async function getFilledPagesCount(campaign) {
  try {
    const { data, error } = await supabase
      .from('campaign_submissions')
      .select('selected_pages')
      .eq('campaign_id', campaign.id)
    
    if (error) throw error

    let totalPages = 0
    data.forEach(submission => {
      if (submission.selected_pages && Array.isArray(submission.selected_pages)) {
        totalPages += submission.selected_pages.length
      }
    })
    
    return totalPages
  } catch (err) {
    console.error('Error getting filled pages count:', err)
    return 0
  }
}

async function copyContactEmails(campaignId) {
  try {
    const { data, error } = await supabase
      .from('campaign_submissions')
      .select('contact_email')
      .eq('campaign_id', campaignId)
    
    if (error) throw error

    const emails = data
      .map(submission => submission.contact_email)
      .filter(email => email) // Remove any null/undefined emails
      .join(', ')
    
    await navigator.clipboard.writeText(emails)
    alert('Contact emails copied to clipboard!')
  } catch (err) {
    console.error('Error copying contact emails:', err)
    alert('Failed to copy contact emails')
  }
}

// Define all functions and variables that need to be used in the template
defineExpose({
  loading,
  error,
  campaigns,
  showNewCampaignForm,
  campaignForm,
  showBrandsModal,
  selectedCampaign,
  modalSubmissions,
  filledPagesCounts,
  editCampaign,
  saveCampaign,
  cancelEdit,
  addExistingBrand,
  removeBrand,
  showBrands,
  closeBrandsModal,
  viewCampaignForm,
  formatDate,
  formatNumber,
  calculateBusinessDays,
  getFilledPagesCount,
  copyContactEmails
})
</script>

<style scoped>
:root {
  --primary-color: #ff69b4;
  --primary-light: rgba(255, 105, 180, 0.1);
  --text-color: #333;
  --bg-color: #f9f2f4;
  --card-bg: #fff;
  --border-color: #ddd;
  --success-color: #4CAF50;
  --warning-color: #FFC107;
  --danger-color: #F44336;
}

.campaign-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
}

header img {
  max-width: 250px;
  margin-bottom: 15px;
}

header h1 {
  color: var(--primary-color);
  font-size: 2.5rem;
  margin-bottom: 10px;
}

header p {
  font-size: 1.2rem;
  color: #666;
}

.card {
  background: var(--card-bg);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin-bottom: 30px;
}

.card h2 {
  color: var(--primary-color);
  font-size: 1.8rem;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--primary-light);
}

.form-group {
  margin-bottom: 25px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-col {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.required:after {
  content: " *";
  color: var(--primary-color);
}

input, textarea, select {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  transition: border-color 0.3s;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn:hover {
  background-color: #ff45a1;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(255, 105, 180, 0.3);
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
  color: #222;
}

.btn-group {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

table th {
  background-color: #f5f5f5;
  text-align: left;
  padding: 12px 15px;
  border-bottom: 2px solid var(--primary-color);
}

table td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-active {
  background-color: var(--success-color);
  color: white;
}

.status-draft {
  background-color: var(--warning-color);
  color: #333;
}

.status-closed {
  background-color: var(--danger-color);
  color: white;
}

.progress-bar {
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-top: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 600px;
  width: 90%;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-close:hover {
  color: var(--primary-color);
}

.brand-item {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.brand-item:last-child {
  border-bottom: none;
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

.top-actions {
  margin-bottom: 20px;
}

.error {
  text-align: center;
  padding: 20px;
  background-color: #fff3f3;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  color: #d32f2f;
  margin: 20px 0;
}

.no-submissions {
  text-align: center;
  padding: 20px;
  color: #666;
}

.pages-list {
  list-style: none;
  padding-left: 20px;
  margin-top: 5px;
}

.pages-list li {
  margin-bottom: 5px;
  color: #666;
}

.brand-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 15px;
}

.brand-item h3 {
  color: var(--primary-color);
  margin-bottom: 10px;
}

.brand-item p {
  margin: 5px 0;
}

.brand-item strong {
  color: #333;
}
</style> 