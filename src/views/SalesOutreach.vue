<template>
  <div v-if="isAuthorized" class="sales-outreach">
    <!-- Toast Notification -->
    <div v-if="showToast" class="toast" @click="showToast = false">
      <span class="toast-icon">✔</span>
      <span>{{ toastMessage }}</span>
    </div>
    <h1>Sales Outreach</h1>
    <div class="controls">
      <label for="campaign-select">Select Campaign:</label>
      <select v-model="selectedCampaignId" id="campaign-select">
        <option v-for="campaign in campaigns" :key="campaign.id" :value="campaign.id">
          {{ campaign.name }} (Due: {{ formatDate(campaign.asset_due_date) }})
        </option>
      </select>
      <button class="btn" @click="showAddBrandModal = true">+ Add Brand</button>
    </div>

    <table class="outreach-table">
      <thead>
        <tr>
          <th class="sticky-col">Brand Name</th>
          <th>Contact Name</th>
          <th>Contact Email</th>
          <th>Outreach Status</th>
          <th>Confirmed Price</th>
          <th>Price Status</th>
          <th>Charged</th>
          <th>Receipt URL</th>
          <th>Notes</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in sortedOutreachEntries" :key="entry.id">
          <td class="sticky-col">{{ entry.brand_name }}</td>
          <td>{{ entry.contact_name }}</td>
          <td class="email-cell">{{ entry.contact_email }}</td>
          <td class="outreach-status-cell">
            <select v-model="entry.outreach_status" :class="['status-dropdown', statusColor(entry.outreach_status)]">
              <option v-for="opt in outreachStatusOptions" :key="opt.value" :value="opt.value">
                {{ opt.value }}
              </option>
            </select>
          </td>
          <td>
            <input type="number" v-model="entry.confirmed_price" class="price-input" />
          </td>
          <td>
            <select v-model="entry.price_status">
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </td>
          <td>
            <input type="checkbox" v-model="entry.charged" />
          </td>
          <td>
            <input type="url" v-model="entry.receipt_url" placeholder="Paste receipt URL" class="receipt-url-input" />
          </td>
          <td>
            <input type="text" v-model="entry.notes" placeholder="Notes..." class="notes-input" />
          </td>
          <td>
            <button class="btn btn-primary" @click="updateEntry(entry)">Save</button>
            <button class="btn btn-danger" @click="removeEntry(entry.id)">Remove</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Add Brand Modal -->
    <div v-if="showAddBrandModal" class="modal" @click.self="showAddBrandModal = false">
      <div class="modal-content" @click.stop>
        <span class="modal-close" @click="showAddBrandModal = false">&times;</span>
        <h2>Add Brand to Outreach</h2>
        <input v-model="brandSearch" placeholder="Search by name or email..." @input="filterBrands" />
        <div v-if="filteredBrands.length">
          <ul class="brand-search-list">
            <li v-for="brand in filteredBrands" :key="brand.id">
              <span>{{ brand.name }} ({{ brand.contactEmail }})</span>
              <button class="btn" @click="addExistingBrand(brand)">Add</button>
            </li>
          </ul>
        </div>
        <div v-else>
          <h3>Add New Brand</h3>
          <input v-model="newBrand.name" placeholder="Brand Name" />
          <input v-model="newBrand.contactName" placeholder="Contact Name" />
          <input v-model="newBrand.contactEmail" placeholder="Contact Email" />
          <button class="btn" @click="addNewBrand">Create & Add</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="unauthorized">
    <h2>Unauthorized</h2>
    <p>You do not have access to this page.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabaseClient'

const campaigns = ref([])
const outreachEntries = ref([])
const allBrands = ref([])
const loading = ref(true)
const error = ref(null)
const showAddBrandModal = ref(false)
const brandSearch = ref('')
const newBrand = ref({ name: '', contactName: '', contactEmail: '' })
const filteredBrands = ref([])
const selectedCampaignId = ref(null)
const showToast = ref(false)
const toastMessage = ref('')

const outreachStatusOptions = [
  { value: 'Needs Outreach', color: 'gray' },
  { value: 'No', color: 'red' },
  { value: 'Needs Follow-Up', color: 'orange' },
  { value: 'Ghosted', color: 'purple' },
  { value: 'In - Filling Out Forms', color: 'blue' },
  { value: 'In - Submitted', color: 'green' },
]

const sortedOutreachEntries = computed(() => {
  return outreachEntries.value
    .sort((a, b) => (a.brand_name || '').localeCompare(b.brand_name || ''))
})

async function fetchCampaigns() {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await supabase
      .from('campaigns')
      .select('*')
      .neq('status', 'archived')
      .order('in_home_date', { ascending: true })
    if (err) throw err
    campaigns.value = data || []
    if (!selectedCampaignId.value && campaigns.value.length > 0) {
      selectedCampaignId.value = campaigns.value[0].id
    }
  } catch (err) {
    error.value = 'Failed to load campaigns.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function fetchOutreachEntries() {
  if (!selectedCampaignId.value) return
  loading.value = true
  error.value = null
  try {
    await syncSubmissionsToOutreach()
    const { data, error: err } = await supabase
      .from('campaign_outreach')
      .select('*')
      .eq('campaign_id', selectedCampaignId.value)
    if (err) throw err
    outreachEntries.value = data || []
  } catch (err) {
    error.value = 'Failed to load outreach entries.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function fetchBrands() {
  try {
    // 1. Get all brands from brands table
    const { data: brandsData, error: brandsErr } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true })
    if (brandsErr) throw brandsErr
    // 2. Get all brands from campaign_submissions for selected campaign
    let campaignBrands = []
    if (selectedCampaignId.value) {
      const { data: submissions, error: subErr } = await supabase
        .from('campaign_submissions')
        .select('brand_name, contact_name, contact_email')
        .eq('campaign_id', selectedCampaignId.value)
      if (subErr) throw subErr
      campaignBrands = (submissions || []).map(sub => ({
        name: sub.brand_name,
        contactName: sub.contact_name,
        contactEmail: sub.contact_email
      }))
    }
    // 3. Merge, dedupe by contactEmail (prioritize campaignBrands)
    const emailSet = new Set()
    const merged = []
    for (const b of campaignBrands) {
      if (b.contactEmail && !emailSet.has(b.contactEmail)) {
        merged.push(b)
        emailSet.add(b.contactEmail)
      }
    }
    for (const b of brandsData || []) {
      if (b.contactEmail && !emailSet.has(b.contactEmail)) {
        merged.push({
          id: b.id,
          name: b.name,
          contactName: b.contactName,
          contactEmail: b.contactEmail
        })
        emailSet.add(b.contactEmail)
      }
    }
    allBrands.value = merged
  } catch (err) {
    console.error('Failed to load brands:', err)
  }
}

function filterBrands() {
  const query = brandSearch.value.toLowerCase()
  filteredBrands.value = allBrands.value.filter(
    b => (b.name?.toLowerCase().includes(query) || b.contactEmail?.toLowerCase().includes(query))
  )
}

async function addExistingBrand(brand) {
  try {
    await supabase.from('campaign_outreach').insert({
      campaign_id: selectedCampaignId.value,
      brand_id: brand.id, // bigint
      brand_name: brand.name,
      contact_name: brand.contactName,
      contact_email: brand.contactEmail,
      outreach_status: 'Needs Outreach',
      price_status: 'pending',
      charged: false,
    })
    showAddBrandModal.value = false
    brandSearch.value = ''
    filteredBrands.value = []
    await fetchOutreachEntries()
  } catch (err) {
    alert('Failed to add brand to outreach list.')
    console.error(err)
  }
}

async function addNewBrand() {
  if (!newBrand.value.name || !newBrand.value.contactName || !newBrand.value.contactEmail) return
  try {
    // Insert into brands table first
    const { data: brand, error: brandErr } = await supabase.from('brands').insert({
      name: newBrand.value.name,
      contactName: newBrand.value.contactName,
      contactEmail: newBrand.value.contactEmail,
    }).select().single()
    if (brandErr) throw brandErr
    // Insert into outreach
    await supabase.from('campaign_outreach').insert({
      campaign_id: selectedCampaignId.value,
      brand_id: brand.id, // bigint
      brand_name: brand.name,
      contact_name: brand.contactName,
      contact_email: brand.contactEmail,
      outreach_status: 'Needs Outreach',
      price_status: 'pending',
      charged: false,
    })
    showAddBrandModal.value = false
    newBrand.value = { name: '', contactName: '', contactEmail: '' }
    await fetchBrands()
    await fetchOutreachEntries()
  } catch (err) {
    alert('Failed to add new brand.')
    console.error(err)
  }
}

async function removeEntry(id) {
  try {
    await supabase.from('campaign_outreach').delete().eq('id', id)
    await fetchOutreachEntries()
  } catch (err) {
    alert('Failed to remove outreach entry.')
    console.error(err)
  }
}

async function updateEntry(entry) {
  try {
    await supabase.from('campaign_outreach').update({
      outreach_status: entry.outreach_status,
      confirmed_price: entry.confirmed_price,
      price_status: entry.price_status,
      charged: entry.charged,
      receipt_url: entry.receipt_url,
      notes: entry.notes,
    }).eq('id', entry.id)
    // Show toast
    toastMessage.value = 'Saved!'
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 2000)
  } catch (err) {
    alert('Failed to update outreach entry.')
    console.error(err)
  }
}

// Watch for changes to selected campaign
watch(selectedCampaignId, async () => {
  await fetchOutreachEntries()
  await fetchBrands()
})

onMounted(async () => {
  await fetchCampaigns()
  await fetchBrands()
  await fetchOutreachEntries()
  filterBrands()
})

function statusColor(status) {
  const found = outreachStatusOptions.find(opt => opt.value === status)
  return found ? found.color : 'gray'
}

function formatDate(date) {
  return new Date(date).toLocaleDateString()
}

// Access control (mocked for now)
const userEmail = 'user@postpilot.com' // Replace with actual user email from auth
const isAuthorized = computed(() =>
  userEmail.endsWith('@postpilot.com') || userEmail.endsWith('@gritgrowth.io')
)

// Sync campaign_submissions into campaign_outreach for selected campaign
async function syncSubmissionsToOutreach() {
  if (!selectedCampaignId.value) return
  try {
    // 1. Fetch all campaign_outreach entries for this campaign
    const { data: outreachData, error: outreachErr } = await supabase
      .from('campaign_outreach')
      .select('contact_email')
      .eq('campaign_id', selectedCampaignId.value)
    if (outreachErr) throw outreachErr
    const outreachEmails = new Set((outreachData || []).map(e => e.contact_email))
    // 2. Fetch all campaign_submissions for this campaign
    const { data: submissions, error: subErr } = await supabase
      .from('campaign_submissions')
      .select('brand_name, contact_name, contact_email')
      .eq('campaign_id', selectedCampaignId.value)
    if (subErr) throw subErr
    // 3. For each submission not in outreach, insert into campaign_outreach
    const toInsert = (submissions || []).filter(sub => sub.contact_email && !outreachEmails.has(sub.contact_email))
    if (toInsert.length > 0) {
      const insertRows = toInsert.map(sub => ({
        campaign_id: selectedCampaignId.value,
        brand_name: sub.brand_name,
        contact_name: sub.contact_name,
        contact_email: sub.contact_email,
        outreach_status: 'In - Submitted',
        price_status: 'pending',
        charged: false,
      }))
      await supabase.from('campaign_outreach').insert(insertRows)
    }
  } catch (err) {
    console.error('Failed to sync submissions to outreach:', err)
  }
}
</script>

<style scoped>
.sales-outreach {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
}
.outreach-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 2rem;
  table-layout: auto;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.outreach-table th, .outreach-table td {
  border: 1px solid #eee;
  padding: 0.4rem 0.6rem;
  text-align: left;
  max-width: 180px;
  vertical-align: middle;
  font-size: 0.98em;
  white-space: normal;
  word-break: break-word;
}
.outreach-table th {
  background: #faf7fa;
  position: sticky;
  top: 0;
  z-index: 2;
}
.sticky-col {
  position: sticky;
  left: 0;
  background: #faf7fa;
  z-index: 1;
}
tr {
  transition: background 0.15s;
}
tr:hover {
  background: #f5f5fa;
}
.outreach-table th:nth-child(4),
.outreach-table td.outreach-status-cell {
  min-width: 200px;
  max-width: 220px;
  width: 210px;
  overflow: visible;
}
.status-dropdown {
  border-radius: 12px;
  padding: 0.25em 0.75em 0.25em 0.75em;
  font-weight: bold;
  color: #fff;
  border: none;
  font-size: 0.95em;
  min-width: 180px;
  width: 100%;
  outline: none;
  margin: 0 16px 0 0;
  background: #888;
  z-index: 10;
  position: relative;
}
.status-dropdown.gray { background: #888; }
.status-dropdown.red { background: #e74c3c; }
.status-dropdown.orange { background: #f39c12; }
.status-dropdown.purple { background: #8e44ad; }
.status-dropdown.blue { background: #3498db; }
.status-dropdown.green { background: #27ae60; }
.price-input {
  width: 80px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
.receipt-url-input, .notes-input {
  width: 120px;
  max-width: 100%;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 0.97em;
}
.email-cell {
  max-width: 160px;
  word-break: break-all;
}
@media (max-width: 1100px) {
  .outreach-table th, .outreach-table td {
    font-size: 0.92em;
    padding: 0.3rem 0.4rem;
    max-width: 120px;
  }
  .receipt-url-input, .notes-input {
    width: 80px;
  }
}
@media (max-width: 800px) {
  .outreach-table, .outreach-table th, .outreach-table td {
    font-size: 0.85em;
    padding: 0.2rem 0.2rem;
  }
  .outreach-table {
    display: block;
    overflow-x: auto;
    min-width: 600px;
  }
}
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  min-width: 350px;
  max-width: 500px;
  position: relative;
}
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 1.5rem;
  cursor: pointer;
}
.brand-search-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}
.brand-search-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}
.unauthorized {
  padding: 2rem;
  text-align: center;
}
.btn-primary {
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 14px;
  margin-right: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: #219150;
}
.toast {
  position: fixed;
  top: 32px;
  right: 32px;
  background: #27ae60;
  color: #fff;
  padding: 14px 28px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  font-size: 1.1em;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2000;
  cursor: pointer;
  transition: opacity 0.2s;
}
.toast-icon {
  font-size: 1.3em;
  font-weight: bold;
}
</style> 