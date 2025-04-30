<template>
  <div class="admin-container">
    <div class="header">
      <h1>Invite Code Management</h1>
      <p>Generate and manage invite codes for brands</p>
    </div>

    <!-- Generate New Code Section -->
    <div class="card">
      <h2>Generate New Code</h2>
      <form @submit.prevent="generateCode" class="generate-form">
        <div class="form-group">
          <label for="brand-name">Brand Name</label>
          <input
            type="text"
            id="brand-name"
            v-model="newBrandName"
            required
            placeholder="Enter brand name"
            class="input"
          />
        </div>
        <button type="submit" class="button">
          Generate Code
        </button>
      </form>
    </div>

    <!-- Existing Codes Section -->
    <div class="card">
      <div class="card-header">
        <h2>Existing Codes</h2>
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by brand name or code..."
            class="input"
            @input="filterCodes"
          />
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Brand Name</th>
              <th>Invite Code</th>
              <th>Created</th>
              <th>Last Accessed</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="code in filteredCodes" :key="code.id">
              <td>{{ code.brand_name }}</td>
              <td>
                <span class="code">{{ code.invite_code }}</span>
                <button @click="copyToClipboard(code.invite_code)" class="icon-button">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </td>
              <td>{{ formatDate(code.created_at) }}</td>
              <td>{{ formatDate(code.last_accessed) || 'Never' }}</td>
              <td>
                <span :class="['status-badge', code.is_used ? 'used' : 'active']">
                  {{ code.is_used ? 'Used' : 'Active' }}
                </span>
              </td>
              <td>
                <button 
                  @click="deleteCode(code.id)" 
                  class="icon-button delete"
                  :disabled="code.is_used"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'

const newBrandName = ref('')
const inviteCodes = ref([])
const searchQuery = ref('')

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const filteredCodes = computed(() => {
  if (!searchQuery.value) return inviteCodes.value
  const query = searchQuery.value.toLowerCase()
  return inviteCodes.value.filter(code => 
    code.brand_name.toLowerCase().includes(query) ||
    code.invite_code.toLowerCase().includes(query)
  )
})

const generateCode = async () => {
  try {
    const inviteCode = generateRandomCode()
    const { data, error } = await supabase
      .from('invite_codes')
      .insert([
        {
          invite_code: inviteCode,
          brand_name: newBrandName.value,
          created_at: new Date().toISOString(),
          is_used: false
        }
      ])
      .select()

    if (error) throw error

    // Refresh the list
    await fetchInviteCodes()
    newBrandName.value = ''
  } catch (err) {
    console.error('Error generating code:', err)
    alert('Failed to generate code. Please try again.')
  }
}

const fetchInviteCodes = async () => {
  try {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    inviteCodes.value = data
  } catch (err) {
    console.error('Error fetching codes:', err)
  }
}

const copyToClipboard = async (code) => {
  try {
    await navigator.clipboard.writeText(code)
    alert('Code copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}

const deleteCode = async (id) => {
  if (!confirm('Are you sure you want to delete this invite code?')) return
  
  try {
    const { error } = await supabase
      .from('invite_codes')
      .delete()
      .eq('id', id)

    if (error) throw error
    await fetchInviteCodes()
  } catch (err) {
    console.error('Error deleting code:', err)
    alert('Failed to delete code. Please try again.')
  }
}

onMounted(() => {
  fetchInviteCodes()
})
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.header p {
  color: #718096;
  font-size: 1.1rem;
}

.card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.card h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-box {
  width: 300px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #4a5568;
}

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #2d3748;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #ff69b4;
  box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.1);
}

.button {
  background-color: #ff69b4;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button:hover {
  background-color: #ff45a1;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th {
  background-color: #f7fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
}

.code {
  font-family: monospace;
  background-color: #f7fafc;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  margin-right: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #c6f6d5;
  color: #22543d;
}

.status-badge.used {
  background-color: #fed7d7;
  color: #822727;
}

.icon-button {
  padding: 0.25rem;
  border: none;
  background: none;
  cursor: pointer;
  color: #718096;
  transition: color 0.2s;
}

.icon-button:hover {
  color: #2d3748;
}

.icon-button.delete:hover {
  color: #e53e3e;
}

.icon-button svg {
  width: 1.25rem;
  height: 1.25rem;
}

.generate-form {
  max-width: 400px;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 1rem;
  }

  .search-box {
    width: 100%;
  }
}
</style> 