<template>
  <div class="container">
    <h1>Design Management</h1>
    <!-- Upload New Design (vertical, above library) -->
    <div class="card upload-card">
      <h2>Upload New Design</h2>
      <form @submit.prevent="uploadDesign">
        <div class="form-group">
          <label for="brand" class="required">Brand</label>
          <div class="brand-select-container">
            <div 
              class="brand-select-input" 
              @click="toggleBrandDropdown"
              :class="{ 'is-open': showBrandDropdown }"
            >
              <input
                type="text"
                v-model="brandSearch"
                placeholder="Search or select a brand..."
                @input="filterBrands"
                @focus="showBrandDropdown = true"
                @blur="handleBrandBlur"
                required
              >
              <span class="dropdown-arrow">▼</span>
            </div>
            <div v-if="showBrandDropdown" class="brand-dropdown">
              <div 
                v-for="brand in filteredBrands" 
                :key="brand.id"
                class="brand-option"
                @mousedown="selectBrand(brand)"
                :class="{ 'selected': brand.id === newDesign.brand_id }"
              >
                {{ brand.name }}
              </div>
              <div v-if="filteredBrands.length === 0" class="no-results">
                No brands found
              </div>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="design-name" class="required">Design Name</label>
          <input type="text" id="design-name" v-model="newDesign.name" required>
        </div>
        <div class="form-group">
          <label for="design-description">Description</label>
          <textarea id="design-description" v-model="newDesign.description" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label for="layout-type" class="required">Layout Type</label>
          <select id="layout-type" v-model="newDesign.layout_type" required>
            <option value="">Select layout type...</option>
            <option value="full-page">Full Page Image</option>
            <option value="multi-product">Multiple Products</option>
            <option value="text-image">Text with Image</option>
          </select>
        </div>
        <div class="form-group">
          <label for="design-file" class="required">Design File</label>
          <div class="file-upload">
            <input 
              type="file" 
              id="design-file" 
              @change="handleDesignFileUpload" 
              accept=".pdf,.ai,.psd"
              required
            >
            <label for="design-file">
              <div class="file-upload-icon">📁</div>
              <p>Click to upload design file (PDF, AI, or PSD)</p>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label for="preview-image" class="required">Preview Image</label>
          <div class="file-upload">
            <input 
              type="file" 
              id="preview-image" 
              @change="handlePreviewImageUpload" 
              accept="image/*"
              required
            >
            <label for="preview-image">
              <div class="file-upload-icon">🖼️</div>
              <p>Click to upload preview image</p>
            </label>
          </div>
        </div>
        <button type="submit" class="btn" :disabled="loading">Upload Design</button>
      </form>
    </div>
    <!-- Existing Designs -->
    <div class="card existing-card">
      <div class="designs-header">
        <h2>Existing Designs</h2>
        <div class="designs-controls">
          <input v-model="searchQuery" placeholder="Search designs..." class="search-input" />
          <select v-model="sortKey" class="sort-select">
            <option value="created_at">Newest</option>
            <option value="name">Name (A-Z)</option>
            <option value="layout_type">Layout Type</option>
          </select>
        </div>
      </div>
      <div class="designs-grid">
        <div v-for="design in filteredAndSortedDesigns" :key="design.id" class="design-card">
          <img :src="design.preview_url" :alt="design.name" class="design-preview">
          <div class="design-info">
            <h3>{{ design.name }}</h3>
            <p>{{ design.description }}</p>
            <div class="design-meta">
              <span class="layout-type">{{ design.layout_type }}</span>
              <span class="brand-name">{{ getBrandName(design.brand_id) }}</span>
            </div>
            <div class="design-actions">
              <button @click="downloadDesign(design)" class="btn btn-secondary">Download</button>
              <button @click="editDesign(design)" class="btn btn-primary">Edit</button>
              <button @click="removeDesign(design)" class="btn btn-danger">Remove</button>
              <button @click="toggleDesignStatus(design)" class="btn" :class="{ 'btn-danger': design.is_active }">
                {{ design.is_active ? 'Deactivate' : 'Activate' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Edit Design Modal (stub) -->
    <div v-if="showEditModal" class="modal" @click.self="closeEditModal">
      <div class="modal-content">
        <h2>Edit Design</h2>
        <form @submit.prevent="saveEditDesign">
          <div class="form-group">
            <label>Design Name</label>
            <input v-model="editForm.name" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="editForm.description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Layout Type</label>
            <select v-model="editForm.layout_type" required>
              <option value="full-page">Full Page Image</option>
              <option value="multi-product">Multiple Products</option>
              <option value="text-image">Text with Image</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn secondary" @click="closeEditModal">Cancel</button>
            <button type="submit" class="btn primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabaseClient'

export default {
  name: 'Designs',
  setup() {
    const designs = ref([])
    const brands = ref([])
    const brandSearch = ref('')
    const showBrandDropdown = ref(false)
    const loading = ref(false)
    const newDesign = ref({
      brand_id: '',
      name: '',
      description: '',
      layout_type: '',
      design_file: null,
      preview_file: null
    })
    const searchQuery = ref('')
    const sortKey = ref('created_at')
    const showEditModal = ref(false)
    const editForm = ref({})
    const editingDesignId = ref(null)

    const filteredBrands = computed(() => {
      if (!brandSearch.value) return brands.value
      const search = brandSearch.value.toLowerCase()
      return brands.value.filter(brand => 
        brand.name.toLowerCase().includes(search)
      )
    })

    const filterBrands = () => {
      showBrandDropdown.value = true
    }

    const selectBrand = (brand) => {
      newDesign.value.brand_id = brand.id
      brandSearch.value = brand.name
      showBrandDropdown.value = false
    }

    const toggleBrandDropdown = () => {
      showBrandDropdown.value = !showBrandDropdown.value
    }

    const handleBrandBlur = () => {
      // Delay hiding the dropdown to allow for option selection
      setTimeout(() => {
        showBrandDropdown.value = false
      }, 200)
    }

    const loadDesigns = async () => {
      try {
        const { data, error } = await supabase
          .from('designs')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        designs.value = data
      } catch (err) {
        console.error('Error loading designs:', err)
      }
    }

    const loadBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('id, name')
          .order('name')

        if (error) throw error
        brands.value = data
      } catch (err) {
        console.error('Error loading brands:', err)
      }
    }

    const handleDesignFileUpload = (event) => {
      newDesign.value.design_file = event.target.files[0]
    }

    const handlePreviewImageUpload = (event) => {
      newDesign.value.preview_file = event.target.files[0]
    }

    const uploadDesign = async () => {
      try {
        loading.value = true

        // Upload design file
        const designFileName = `${Date.now()}-${newDesign.value.design_file.name}`
        const { data: designData, error: designError } = await supabase.storage
          .from('designs')
          .upload(designFileName, newDesign.value.design_file)

        if (designError) throw designError

        // Upload preview image
        const previewFileName = `${Date.now()}-${newDesign.value.preview_file.name}`
        const { data: previewData, error: previewError } = await supabase.storage
          .from('design-previews')
          .upload(previewFileName, newDesign.value.preview_file)

        if (previewError) throw previewError

        // Get signed URLs for both files
        const { data: { signedUrl: designUrl } } = await supabase.storage
          .from('designs')
          .createSignedUrl(designFileName, 31536000) // 1 year expiry

        const { data: { signedUrl: previewUrl } } = await supabase.storage
          .from('design-previews')
          .createSignedUrl(previewFileName, 31536000) // 1 year expiry

        // Create design record
        const { data, error } = await supabase
          .from('designs')
          .insert({
            brand_id: newDesign.value.brand_id,
            name: newDesign.value.name,
            description: newDesign.value.description,
            layout_type: newDesign.value.layout_type,
            design_url: designUrl,
            preview_url: previewUrl,
            is_active: true
          })
          .select()

        if (error) throw error

        // Reset form and reload designs
        newDesign.value = {
          brand_id: '',
          name: '',
          description: '',
          layout_type: '',
          design_file: null,
          preview_file: null
        }
        await loadDesigns()
        
        alert('Design uploaded successfully!')
      } catch (err) {
        console.error('Error uploading design:', err)
        alert('Failed to upload design. Please try again.')
      } finally {
        loading.value = false
      }
    }

    const downloadDesign = (design) => {
      window.open(design.design_url, '_blank')
    }

    const toggleDesignStatus = async (design) => {
      try {
        const { error } = await supabase
          .from('designs')
          .update({ is_active: !design.is_active })
          .eq('id', design.id)

        if (error) throw error
        await loadDesigns()
      } catch (err) {
        console.error('Error toggling design status:', err)
        alert('Failed to update design status. Please try again.')
      }
    }

    const getBrandName = (brandId) => {
      const brand = brands.value.find(b => b.id === brandId)
      return brand ? brand.name : 'Unknown Brand'
    }

    const filteredAndSortedDesigns = computed(() => {
      let result = designs.value
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        result = result.filter(d =>
          d.name.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          (d.layout_type && d.layout_type.toLowerCase().includes(q))
        )
      }
      if (sortKey.value === 'name') {
        result = [...result].sort((a, b) => a.name.localeCompare(b.name))
      } else if (sortKey.value === 'layout_type') {
        result = [...result].sort((a, b) => a.layout_type.localeCompare(b.layout_type))
      } else {
        result = [...result].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }
      return result
    })

    const editDesign = (design) => {
      editingDesignId.value = design.id
      editForm.value = { ...design }
      showEditModal.value = true
    }
    const closeEditModal = () => {
      showEditModal.value = false
      editingDesignId.value = null
      editForm.value = {}
    }
    const saveEditDesign = async () => {
      try {
        const { error } = await supabase
          .from('designs')
          .update({
            name: editForm.value.name,
            description: editForm.value.description,
            layout_type: editForm.value.layout_type
          })
          .eq('id', editingDesignId.value)
        if (error) throw error
        await loadDesigns()
        closeEditModal()
        alert('Design updated!')
      } catch (err) {
        alert('Failed to update design: ' + err.message)
      }
    }
    const removeDesign = async (design) => {
      if (!confirm(`Are you sure you want to remove the design "${design.name}"? This cannot be undone.`)) return
      try {
        const { error } = await supabase
          .from('designs')
          .delete()
          .eq('id', design.id)
        if (error) throw error
        await loadDesigns()
        alert('Design removed!')
      } catch (err) {
        alert('Failed to remove design: ' + err.message)
      }
    }

    onMounted(() => {
      loadDesigns()
      loadBrands()
    })

    return {
      designs,
      brands,
      loading,
      newDesign,
      handleDesignFileUpload,
      handlePreviewImageUpload,
      uploadDesign,
      downloadDesign,
      toggleDesignStatus,
      getBrandName,
      brandSearch,
      filteredBrands,
      filterBrands,
      showBrandDropdown,
      selectBrand,
      toggleBrandDropdown,
      handleBrandBlur,
      searchQuery,
      sortKey,
      filteredAndSortedDesigns,
      editDesign,
      removeDesign,
      showEditModal,
      editForm,
      closeEditModal,
      saveEditDesign
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 32px;
}
.upload-card {
  max-width: 500px;
  margin: 0 auto 32px auto;
}
.form-group {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
}
.form-group label {
  font-weight: 600;
  margin-bottom: 6px;
}
.file-upload {
  margin-top: 4px;
}
.existing-card {
  margin: 0 auto;
}
.designs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.designs-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}
.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
.sort-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
.designs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 20px;
}
.design-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 420px;
  padding-bottom: 16px;
}
.design-preview {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-bottom: 1px solid #eee;
}
.design-info {
  padding: 15px;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.design-meta {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  font-size: 0.9em;
  color: #666;
}
.design-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}
.btn-danger {
  background-color: #dc3545;
}
.btn-danger:hover {
  background-color: #c82333;
}
.btn-primary {
  background-color: #007bff;
  color: white;
}
.btn-primary:hover {
  background-color: #0056b3;
}
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  z-index: 10001;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
.brand-select-container {
  position: relative;
  width: 100%;
}

.brand-select-input {
  position: relative;
  width: 100%;
  
  input {
    width: 100%;
    padding: 10px;
    padding-right: 30px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }

  .dropdown-arrow {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none;
    transition: transform 0.2s;
  }

  &.is-open .dropdown-arrow {
    transform: translateY(-50%) rotate(180deg);
  }
}

.brand-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 4px;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.brand-option {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  &.selected {
    background-color: var(--primary-light);
    color: var(--primary-color);
  }
}

.no-results {
  padding: 8px 12px;
  color: #666;
  font-style: italic;
}
</style> 