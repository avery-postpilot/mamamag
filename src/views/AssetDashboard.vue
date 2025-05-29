<template>
  <div class="asset-dashboard">
    <header class="dashboard-header">
      <div class="header-content">
        <img src="../assets/mamamag-logo.svg" alt="MamaMag Logo" class="logo">
        <h1>Asset Dashboard</h1>
      </div>
      
      <div class="controls">
        <div class="filter-controls">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search brands or products..."
              @input="filterAssets"
            >
          </div>
          <label class="show-archived">
            <input 
              type="checkbox" 
              v-model="showArchived"
              @change="filterAssets"
            >
            Show Archived Campaigns
          </label>
        </div>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading assets...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <div v-else class="dashboard-content">
      <div v-for="campaign in filteredCampaigns" :key="campaign.id" class="campaign-section">
        <div class="campaign-header" @click="toggleCampaign(campaign.id)">
          <div class="campaign-info">
            <div class="campaign-title">
              <span class="toggle-icon">{{ isCampaignExpanded(campaign.id) ? '▼' : '▶' }}</span>
              <h2>{{ campaign.name }}</h2>
            </div>
            <div class="campaign-badges">
              <span class="campaign-status" :class="{ active: isCampaignActive(campaign) }">
                {{ isCampaignActive(campaign) ? 'Active' : 'Closed' }}
              </span>
              <span v-if="campaign.archived" class="archive-badge">Archived</span>
            </div>
          </div>
          <div class="campaign-actions">
            <button 
              class="btn archive-btn" 
              @click.stop="toggleArchive(campaign)"
              :class="{ 'unarchive': campaign.archived }"
            >
              {{ campaign.archived ? 'Unarchive' : 'Archive' }}
            </button>
            <button 
              class="btn primary" 
              @click.stop="downloadCampaignAssets(campaign)"
            >
              Download All Assets
            </button>
          </div>
        </div>

        <div v-if="isCampaignExpanded(campaign.id)" class="submission-sections">
          <!-- Brand Selector Dropdown -->
          <div class="brand-selector">
            <label for="brand-select">Select Brand:</label>
            <select 
              id="brand-select" 
              v-model="selectedBrands[campaign.id]" 
              @change="handleBrandSelection(campaign.id)"
            >
              <option value="all">All Brands</option>
              <option 
                v-for="submission in campaign.submissions" 
                :key="submission.id" 
                :value="submission.id"
              >
                {{ submission.brand_name }}
              </option>
            </select>
          </div>

          <!-- Horizontal Submission Display -->
          <div class="submissions-container">
            <div 
              v-for="submission in filteredSubmissions(campaign)" 
              :key="submission.id" 
              class="submission-section"
            >
              <div class="submission-header">
                <div class="submission-info">
                  <div class="brand-header">
                    <div 
                      v-if="submission.brand_logo_url" 
                      class="brand-logo-container"
                      @click="showImagePreview({ image_url: submission.brand_logo_url }, submission)"
                    >
                      <img 
                        :src="getImageUrl(submission.brand_logo_url, submission.campaign_id)" 
                        :alt="`${submission.brand_name} logo`"
                        class="brand-logo"
                      >
                    </div>
                    <div class="brand-details">
                      <h3>{{ submission.brand_name }}</h3>
                      <span class="design-status" :class="{ added: submission.added_to_design }">
                        {{ submission.added_to_design ? 'Added to Design' : 'Pending Design' }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="submission-actions">
                  <button 
                    class="btn" 
                    :class="{ success: submission.added_to_design }"
                    @click="toggleDesignStatus(submission)"
                  >
                    {{ submission.added_to_design ? '✓ Added to Design' : 'Add to Design' }}
                  </button>
                  <button 
                    class="btn secondary" 
                    @click="downloadBrandLogo(submission)"
                    :disabled="!submission.brand_logo_url"
                  >
                    Download Logo
                  </button>
                  <button 
                    class="btn secondary" 
                    @click="downloadSingleAsset(submission)"
                  >
                    Download Assets
                  </button>
                  <button 
                    v-if="isAuthorizedUser()"
                    class="btn primary"
                    @click="openEditModal(submission)"
                  >
                    Edit Submission
                  </button>
                </div>
              </div>

              <!-- Designer Notes Section -->
              <div v-if="isAuthorizedUser()" class="designer-notes-section">
                <div class="notes-header">
                  <h4>Designer Notes</h4>
                  <button 
                    class="btn secondary"
                    @click="toggleNotesEdit(submission)"
                  >
                    {{ isEditingNotes(submission.id) ? 'Cancel' : 'Edit Notes' }}
                  </button>
                </div>
                
                <div v-if="isEditingNotes(submission.id)" class="notes-edit">
                  <textarea
                    v-model="editNotes[submission.id]"
                    placeholder="Add notes for the designer..."
                    rows="4"
                  ></textarea>
                  <div class="notes-actions">
                    <button 
                      class="btn primary"
                      @click="saveDesignerNotes(submission)"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
                
                <div v-else class="notes-display">
                  <p v-if="submission.designer_notes" class="notes-content">
                    {{ submission.designer_notes }}
                  </p>
                  <p v-else class="no-notes">
                    No designer notes yet.
                  </p>
                </div>
              </div>

              <!-- Row layout for products -->
              <div class="products-row">
                <div 
                  v-for="(page, pageIdx) in submission.selected_pages" 
                  :key="page.page_id"
                  class="product-container"
                >
                  <div class="product-card main-product">
                    <div class="product-card-header">
                      <span class="page-number">Page {{ page.page_id }}</span>
                      <span class="layout-type">{{ page.layout }}</span>
                    </div>

                    <div class="product-card-content">
                      <div 
                        class="product-thumbnail" 
                        @click="showImagePreview(page, submission)"
                      >
                        <img 
                          v-if="page.image_url" 
                          :src="getImageUrl(page.image_url, submission.campaign_id)" 
                          :alt="page.product_name || 'Product image'"
                          class="thumbnail"
                        >
                        <img v-else-if="page.preview_url" :src="getImageUrl(page.preview_url, submission.campaign_id)" :alt="page.product_name || 'Preview image'" class="thumbnail">
                        <div v-else class="no-image">
                          <span class="no-image-icon">📷</span>
                        </div>
                      </div>
                      
                      <div class="product-info">
                        <h4 class="product-name">{{ page.product_name || 'Untitled Product' }}</h4>
                        <p class="product-description">{{ page.product_description || 'No description available.' }}</p>
                        <p class="price">${{ formatNumber(page.product_price) || 'Price not set' }}</p>
                        <p v-if="page.discount_code" class="discount-code">{{ page.discount_code }}</p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Additional Products displayed horizontally -->
                  <div v-if="page.layout === 'multi-product' && page.additional_products?.length" class="additional-products-container">
                    <div 
                      v-for="(product, index) in page.additional_products" 
                      :key="index" 
                      class="product-card additional-product"
                      @click="showImagePreview(product, submission)"
                    >
                      <div class="product-thumbnail sm">
                        <img 
                          v-if="product.image_url" 
                          :src="getImageUrl(product.image_url, submission.campaign_id)" 
                          :alt="product.name || 'Additional product'"
                          class="thumbnail"
                        >
                        <div v-else class="no-image">
                          <span class="no-image-icon">📷</span>
                        </div>
                      </div>
                      <div class="product-info sm">
                        <h5 class="product-name">{{ product.name }}</h5>
                        <p class="price">${{ formatNumber(product.price) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <div v-if="previewImage" class="image-preview-modal" @click="closePreview">
      <div class="modal-content" @click.stop>
        <button class="close-button" @click="closePreview">&times;</button>
        <img :src="previewImage" :alt="previewImageAlt" class="preview-image">
      </div>
    </div>

    <!-- Edit Submission Modal -->
    <div v-if="showEditModal" class="modal" @click.self="closeEditModal">
      <div class="modal-content">
        <h2>Edit Submission</h2>
        <form @submit.prevent="saveEditSubmission">
          <div v-for="(page, pageIdx) in editForm.selected_pages" :key="page.page_id" class="edit-page-form">
            <h3>Page {{ page.page_id }}</h3>
            <div class="form-row">
              <label>Product Name</label>
              <input v-model="page.product_name" type="text" required />
            </div>
            <div class="form-row">
              <label>Product Price</label>
              <input v-model.number="page.product_price" type="number" min="0" step="0.01" required />
            </div>
            <div class="form-row">
              <label>Product Description</label>
              <textarea v-model="page.product_description" required></textarea>
            </div>
            <div class="form-row">
              <label>Discount Code</label>
              <input v-model="page.discount_code" type="text" />
            </div>
            <div class="form-row">
              <label>Product Image</label>
              <input type="file" @change="e => handleEditImageChange(e, pageIdx)" accept=".png,.jpg,.jpeg" />
              <div v-if="page.image_url">
                <img :src="page.image_url" alt="Current Image" style="max-width:100px;max-height:100px; margin-top: 8px;" />
              </div>
            </div>

            <!-- Additional Products Editing for multi-product layout -->
            <div v-if="page.layout === 'multi-product' && page.additional_products?.length" class="additional-products-edit">
              <h4>Additional Products</h4>
              <div v-for="(product, prodIdx) in page.additional_products" :key="prodIdx" class="additional-product-edit">
                <div class="form-row">
                  <label>Product Name</label>
                  <input v-model="product.name" type="text" required />
                </div>
                <div class="form-row">
                  <label>Product Price</label>
                  <input v-model.number="product.price" type="number" min="0" step="0.01" required />
                </div>
                <div class="form-row">
                  <label>Product Description</label>
                  <textarea v-model="product.description" required></textarea>
                </div>
                <div class="form-row">
                  <label>Product Image</label>
                  <input type="file" @change="e => handleEditAdditionalProductImageChange(e, pageIdx, prodIdx)" accept=".png,.jpg,.jpeg" />
                  <div v-if="product.image_url">
                    <img :src="product.image_url" alt="Current Image" style="max-width:100px;max-height:100px; margin-top: 8px;" />
                  </div>
                </div>
                <hr v-if="prodIdx < page.additional_products.length - 1" />
              </div>
            </div>
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
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { isAuthorizedUser } from '@/stores/auth'

export default {
  name: 'AssetDashboard',
  setup() {
    const loading = ref(true)
    const error = ref(null)
    const submissions = ref([])
    const campaigns = ref([])
    const searchQuery = ref('')
    const showArchived = ref(false)
    const expandedCampaigns = ref(new Set())
    const previewImage = ref(null)
    const previewImageAlt = ref('')
    const showEditModal = ref(false)
    const editSubmission = ref(null)
    const editForm = ref({})
    const editImageFiles = ref({})
    const editAdditionalProductImageFiles = ref({})
    const editNotes = ref({})
    const editingNotesId = ref(null)
    const selectedBrands = ref({})

    // Add sanitize helper at the top of setup()
    const sanitize = str => (str || '').replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Load data from Supabase
    const loadData = async () => {
      try {
        loading.value = true
        error.value = null

        // Load campaigns
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
        
        if (campaignError) {
          console.error('Error loading campaigns:', campaignError)
          throw campaignError
        }
        campaigns.value = campaignData

        // Initialize selectedBrands with 'all' for each campaign
        campaigns.value.forEach(campaign => {
          selectedBrands.value[campaign.id] = 'all'
        })

        // Load submissions with all necessary fields
        const { data: submissionData, error: submissionError } = await supabase
          .from('campaign_submissions')
          .select(`
            id,
            campaign_id,
            brand_name,
            contact_name,
            contact_email,
            brand_website,
            mailing_address,
            created_at,
            updated_at,
            selected_pages,
            brand_logo_url,
            added_to_design,
            additional_products,
            designer_notes
          `)
          .order('created_at', { ascending: false })

        if (submissionError) {
          console.error('Error loading submissions:', submissionError)
          throw submissionError
        }

        // Process submissions
        submissions.value = await Promise.all(submissionData.map(async submission => {
          console.log('Processing submission:', submission.id)
          const processedPages = Array.isArray(submission.selected_pages) 
            ? await Promise.all(submission.selected_pages.map(async page => {
                console.log('Processing page:', page)
                // Get additional products from the JSONB column
                const additionalProducts = submission.additional_products || []
                
                // If there's a design_id, fetch the design data
                let designData = null
                if (page.design_id) {
                  const { data: design, error: designError } = await supabase
                    .from('designs')
                    .select('*')
                    .eq('id', page.design_id)
                    .single()
                  
                  if (!designError && design) {
                    designData = design
                  }
                }

                return {
                  ...page,
                  image_url: page.image_url || null,
                  design_data: designData,
                  additional_products: additionalProducts.map(product => ({
                    name: product.name || 'Untitled Product',
                    description: product.description || 'No description available',
                    price: product.price || 0,
                    image_url: product.image?.url || null
                  }))
                }
              }))
            : []
          return {
            ...submission,
            selected_pages: processedPages
          }
        }))

      } catch (err) {
        console.error('Error loading data:', err)
        error.value = `Failed to load dashboard data: ${err.message}`
      } finally {
        loading.value = false
      }
    }

    // Filter and group submissions by campaign
    const filteredCampaigns = computed(() => {
      const filteredSubmissions = submissions.value.filter(submission => {
        const searchMatch = !searchQuery.value || 
          submission.brand_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          submission.selected_pages.some(page => 
            page.product_name?.toLowerCase().includes(searchQuery.value.toLowerCase())
          )

        return searchMatch
      })

      const groups = {}
      
      campaigns.value
        .filter(campaign => showArchived.value || !campaign.archived)
        .forEach(campaign => {
          groups[campaign.id] = {
            ...campaign,
            submissions: []
          }
        })

      filteredSubmissions.forEach(submission => {
        if (groups[submission.campaign_id]) {
          groups[submission.campaign_id].submissions.push(submission)
        }
      })

      return Object.values(groups)
        .filter(group => group.submissions.length > 0)
        .sort((a, b) => {
          // Sort by archived status first, then by name
          if (a.archived === b.archived) {
            return a.name.localeCompare(b.name)
          }
          return a.archived ? 1 : -1
        })
    })

    // Helper functions
    const getImageUrl = (filename, campaignId) => {
      if (!filename) {
        console.log('Missing filename:', { filename, campaignId })
        return null
      }
      
      // If it's already a full URL, return it
      if (filename.startsWith('http')) {
        console.log('Using direct URL:', filename)
        return filename
      }

      try {
        // Check if this is a brand logo
        if (filename.includes('logo')) {
          // Clean up the filename to remove any duplicate paths
          const cleanFilename = filename.replace(/^.*?logos\//, '')
          // Construct the full Supabase URL for brand logos
          const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/brand-logos/${campaignId}/logos/${cleanFilename}`
          console.log('Generated brand logo URL:', url)
          return url
        }

        // For product images, handle potential path formats
        let path = filename
        // If the filename doesn't include a directory structure, add the campaign ID
        if (!path.includes('/')) {
          path = `${campaignId}/${path}`
        }
      
        // Construct the full Supabase URL for product images
        const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
        console.log('Generated product image URL:', url)
        return url
      } catch (error) {
        console.error('Error generating image URL:', error)
        // Return the original filename as a fallback
        return filename
      }
    }

    const getPageImage = (page) => {
      try {
        console.log('Getting image for page:', JSON.stringify(page, null, 2))
        
        // Find the submission for this page
        const submission = submissions.value.find(s => 
          s.selected_pages.some(p => p.page_id === page.page_id)
        )
        
        if (!submission) {
          console.log('Could not find submission for page:', page.page_id)
          return null
        }

        // Construct the full URL using the campaign ID and image filename
        const imageUrl = page.image_url
        if (!imageUrl) {
          console.log('No image URL found in page data')
          return null
        }

        // If it's already a full URL, return it
        if (imageUrl.startsWith('http')) {
          console.log('Using direct URL:', imageUrl)
          return imageUrl
        }

        // Construct the full Supabase URL
        const fullUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/campaign-${submission.campaign_id}/${imageUrl}`
        console.log('Constructed full URL:', fullUrl)
        return fullUrl
      } catch (e) {
        console.error('Error getting page image:', e)
        return null
      }
    }

    const getPageProduct = (page) => {
      try {
        if (page.product) {
          return typeof page.product === 'string' 
            ? JSON.parse(page.product)
            : page.product
        }
        
        return {
          name: page.product_name || 'N/A',
          price: page.product_price || 'N/A',
          description: page.product_description || 'N/A',
          image_url: page.product_image_url || null
        }
      } catch (e) {
        console.error('Error getting page product:', e)
        return null
      }
    }

    const toggleCampaign = (campaignId) => {
      if (expandedCampaigns.value.has(campaignId)) {
        expandedCampaigns.value.delete(campaignId)
      } else {
        expandedCampaigns.value.add(campaignId)
      }
    }

    const isCampaignExpanded = (campaignId) => {
      return expandedCampaigns.value.has(campaignId)
    }

    const toggleDesignStatus = async (submission) => {
      try {
        const { error } = await supabase
          .from('campaign_submissions')
          .update({ added_to_design: !submission.added_to_design })
          .eq('id', submission.id)

        if (error) throw error

        // Update local state
        submission.added_to_design = !submission.added_to_design
      } catch (err) {
        console.error('Error toggling design status:', err)
        alert('Failed to update design status. Please try again.')
      }
    }

    const downloadSingleAsset = async (submission) => {
      try {
        console.log('Starting download for submission:', submission.id)
        const zip = new JSZip()
        
        // Add copy file
        const copyContent = `Brand: ${submission.brand_name}
Contact: ${submission.contact_name}
Email: ${submission.contact_email}
Website: ${submission.brand_website || 'N/A'}

Selected Pages:
${submission.selected_pages.map(page => `
Page: ${page.page_id}
Layout: ${page.layout}
Product: ${page.product_name}
Price: $${page.product_price}
Description: ${page.product_description}
${page.discount_code ? `Discount Code: ${page.discount_code}` : ''}
`).join('\n')}

Additional Products:
${submission.additional_products ? submission.additional_products.map(product => `
Product: ${product.name}
Price: $${product.price}
Description: ${product.description}
`).join('\n') : 'None'}

Text Content:
${submission.text_content || 'None'}`
        
        zip.file('copy.txt', copyContent)

        // Add brand logo if available
        if (submission.brand_logo_url) {
          try {
            console.log('Downloading brand logo:', submission.brand_logo_url)
            const logoUrl = getImageUrl(submission.brand_logo_url, submission.campaign_id)
            console.log('Logo URL:', logoUrl)
            const logoResponse = await fetch(logoUrl, { mode: 'cors', cache: 'no-cache' })
            
            if (!logoResponse.ok) {
              throw new Error(`Logo HTTP error! status: ${logoResponse.status}`)
            }
            
            const logoBlob = await logoResponse.blob()
            console.log('Logo blob:', logoBlob.type, logoBlob.size)
            // Use original filename from URL
            const logoFileName = submission.brand_logo_url.split('/').pop()
            zip.file(`brand-logo/${logoFileName}`, logoBlob, { binary: true })
            console.log('Logo added to zip')
          } catch (err) {
            console.error('Error downloading brand logo:', err)
          }
        }

        // Add all page assets (image, preview, design) for every page
        // Deduplicate design files by design_id
        const addedDesignIds = new Set();
        for (const page of submission.selected_pages) {
          // Product image
          if (page.image_url) {
            try {
              console.log('Downloading product image for page', page.page_id, ':', page.image_url)
              const imageUrl = getImageUrl(page.image_url, submission.campaign_id)
              console.log('Full image URL:', imageUrl)
              const response = await fetch(imageUrl, { mode: 'cors', cache: 'no-cache' })
              
              if (!response.ok) {
                throw new Error(`Image HTTP error! status: ${response.status}`)
              }
              
              const blob = await response.blob()
              console.log('Image blob:', blob.type, blob.size)
              // Use original filename from URL
              const fileName = page.image_url.split('/').pop()
              zip.file(`products/${fileName}`, blob, { binary: true })
              console.log('Product image added to zip')
            } catch (err) {
              console.error(`Error downloading image for ${page.page_id}:`, err)
            }
          }

          // Always add design file from design_data if available, but only once per design_id
          if (page.design_data && page.design_data.design_url && page.design_data.id && !addedDesignIds.has(page.design_data.id)) {
            try {
              console.log('Downloading design file for design ID:', page.design_data.id)
              const designBlob = await fetch(page.design_data.design_url, { 
                mode: 'cors', 
                cache: 'no-cache',
                headers: {
                  'Accept': '*/*'
                }
              })
              
              if (!designBlob.ok) {
                throw new Error(`Design file HTTP error! status: ${designBlob.status}`)
              }
              
              const designBlobContent = await designBlob.blob()
              console.log('Design file blob:', designBlobContent.type, designBlobContent.size)
              
              // Generate filename from design name and appropriate extension
              const ext = designBlobContent.type === 'application/pdf' ? 'pdf' :
                         designBlobContent.type === 'application/postscript' ? 'ai' :
                         designBlobContent.type === 'image/vnd.adobe.photoshop' ? 'psd' : 'file'
              const designFileName = `${page.design_data.name || `design-${page.design_data.id}`}.${ext}`
              
              zip.file(`designs/${designFileName}`, designBlobContent, { binary: true })
              console.log('Design file added to zip:', designFileName)
              addedDesignIds.add(page.design_data.id);
            } catch (err) {
              console.error(`Error downloading design file for page ${page.page_id}:`, err)
              // Add a note to the copy file about the failed download
              copyContent += `\nNote: Failed to download design file for page ${page.page_id}: ${err.message}`
            }
          }

          // Add additional product images from each page's additional_products
          if (page.layout === 'multi-product' && page.additional_products?.length) {
            for (const product of page.additional_products) {
              if (product.image_url) {
                try {
                  console.log('Downloading additional product image:', product.name, product.image_url)
                  const imageUrl = getImageUrl(product.image_url, submission.campaign_id)
                  console.log('Full additional product image URL:', imageUrl)
                  const response = await fetch(imageUrl, { mode: 'cors', cache: 'no-cache' })
                  
                  if (!response.ok) {
                    throw new Error(`Additional product image HTTP error! status: ${response.status}`)
                  }
                  
                  const blob = await response.blob()
                  console.log('Additional product image blob:', blob.type, blob.size)
                  // Use original filename from URL
                  const fileName = product.image_url.split('/').pop()
                  zip.file(`additional-products/${fileName}`, blob, { binary: true })
                  console.log('Additional product image added to zip')
                } catch (err) {
                  console.error(`Error downloading additional product image for ${product.name}:`, err)
                }
              }
            }
          }
        }

        // Add additional product images from the submission level (backwards compatibility)
        if (submission.additional_products) {
          for (const product of submission.additional_products) {
            if (product.image?.url) {
              try {
                console.log('Downloading legacy additional product image:', product.name, product.image.url)
                const imageUrl = product.image.url.startsWith('http') ? product.image.url : getImageUrl(product.image.url, submission.campaign_id)
                console.log('Full legacy additional product image URL:', imageUrl)
                const response = await fetch(imageUrl, { mode: 'cors', cache: 'no-cache' })
                
                if (!response.ok) {
                  throw new Error(`Legacy additional product image HTTP error! status: ${response.status}`)
                }
                
                const blob = await response.blob()
                console.log('Legacy additional product image blob:', blob.type, blob.size)
                // Use original filename from URL
                const fileName = product.image.url.split('/').pop()
                zip.file(`additional-products/${fileName}`, blob, { binary: true })
                console.log('Legacy additional product image added to zip')
              } catch (err) {
                console.error(`Error downloading additional product image for ${product.name}:`, err)
              }
            }
          }
        }

        // Generate and download zip file
        console.log('Generating zip file...')
        const content = await zip.generateAsync({ 
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        })
        console.log('Zip generated, size:', content.size)
        const link = document.createElement('a')
        link.href = URL.createObjectURL(content)
        link.download = `${submission.brand_name}-assets.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        console.log('Download started')
      } catch (err) {
        console.error('Error creating zip file:', err)
        alert('Failed to download assets. Please try again.')
      }
    }

    const downloadCampaignAssets = async (campaign) => {
      try {
        loading.value = true
        error.value = null

        // Create a new zip file
        const zip = new JSZip()

        // Loop through all submissions in the campaign
        if (!campaign.submissions || !Array.isArray(campaign.submissions)) {
          throw new Error('No submissions found for this campaign.')
        }

        // Add all page assets (image, preview, design) for every page in campaign download
        // Deduplicate design files by design_id per submission
        const addedDesignIds = new Set();
        for (const submission of campaign.submissions) {
          // Add a folder for each brand/submission
          const brandFolder = zip.folder(submission.brand_name.replace(/[^a-z0-9]/gi, '_'))

          // Add copy file
          const copyContent = `Brand: ${submission.brand_name}
Contact: ${submission.contact_name}
Email: ${submission.contact_email}
Website: ${submission.brand_website || 'N/A'}
\nSelected Pages:\n${submission.selected_pages.map(page => `Page: ${page.page_id}\nLayout: ${page.layout}\nProduct: ${page.product_name}\nPrice: $${page.product_price}\nDescription: ${page.product_description}\n${page.discount_code ? `Discount Code: ${page.discount_code}` : ''}\n`).join('\n')}\n\nAdditional Products:\n${submission.additional_products ? submission.additional_products.map(product => `Product: ${product.name}\nPrice: $${product.price}\nDescription: ${product.description}\n`).join('\n') : 'None'}\n\nText Content:\n${submission.text_content || 'None'}`
          brandFolder.file('copy.txt', copyContent)

          // Add brand logo if available
          if (submission.brand_logo_url) {
            try {
              const logoUrl = getImageUrl(submission.brand_logo_url, submission.campaign_id)
              const logoResponse = await fetch(logoUrl, { mode: 'cors', cache: 'no-cache' })
              if (!logoResponse.ok) throw new Error(`Logo HTTP error! status: ${logoResponse.status}`)
              const logoBlob = await logoResponse.blob()
              const logoFileName = submission.brand_logo_url.split('/').pop()
              brandFolder.file(`brand-logo/${logoFileName}`, logoBlob, { binary: true })
            } catch (err) {
              console.error('Error downloading brand logo:', err)
            }
          }

          // Add all page assets (image, preview, design) for every page
          for (const page of submission.selected_pages) {
            // Product image
            if (page.image_url) {
              try {
                const imageUrl = getImageUrl(page.image_url, submission.campaign_id)
                const response = await fetch(imageUrl, { mode: 'cors', cache: 'no-cache' })
                if (!response.ok) throw new Error(`Image HTTP error! status: ${response.status}`)
                const blob = await response.blob()
                const fileName = page.image_url.split('/').pop()
                brandFolder.file(`products/${fileName}`, blob, { binary: true })
              } catch (err) {
                console.error(`Error downloading image for ${page.page_id}:`, err)
              }
            }

            // Always add design file from design_data if available, but only once per design_id
            if (page.design_data && page.design_data.design_url && page.design_data.id && !addedDesignIds.has(page.design_data.id)) {
              try {
                const designBlob = await fetch(page.design_data.design_url, { 
                  mode: 'cors', 
                  cache: 'no-cache',
                  headers: {
                    'Accept': '*/*'
                  }
                })
                if (!designBlob.ok) throw new Error(`Design file HTTP error! status: ${designBlob.status}`)
                const designBlobContent = await designBlob.blob()
                const ext = designBlobContent.type === 'application/pdf' ? 'pdf' :
                           designBlobContent.type === 'application/postscript' ? 'ai' :
                           designBlobContent.type === 'image/vnd.adobe.photoshop' ? 'psd' : 'file'
                const designFileName = `${page.design_data.name || `design-${page.design_data.id}`}.${ext}`
                brandFolder.file(`designs/${designFileName}`, designBlobContent, { binary: true })
                addedDesignIds.add(page.design_data.id);
              } catch (err) {
                console.error(`Error downloading design file for page ${page.page_id}:`, err)
              }
            }

            // Add additional product images from each page's additional_products
            if (page.layout === 'multi-product' && page.additional_products?.length) {
              for (const product of page.additional_products) {
                if (product.image_url) {
                  try {
                    const imageUrl = getImageUrl(product.image_url, submission.campaign_id)
                    const response = await fetch(imageUrl, { mode: 'cors', cache: 'no-cache' })
                    if (!response.ok) throw new Error(`Additional product image HTTP error! status: ${response.status}`)
                    const blob = await response.blob()
                    const fileName = product.image_url.split('/').pop()
                    brandFolder.file(`additional-products/${fileName}`, blob, { binary: true })
                  } catch (err) {
                    console.error(`Error downloading additional product image for ${product.name}:`, err)
                  }
                }
              }
            }
          }

          // Add additional product images from the submission level (backwards compatibility)
          if (submission.additional_products) {
            for (const product of submission.additional_products) {
              if (product.image?.url) {
                try {
                  const imageUrl = product.image.url.startsWith('http') ? product.image.url : getImageUrl(product.image.url, submission.campaign_id)
                  const response = await fetch(imageUrl, { mode: 'cors', cache: 'no-cache' })
                  if (!response.ok) throw new Error(`Legacy additional product image HTTP error! status: ${response.status}`)
                  const blob = await response.blob()
                  const fileName = product.image.url.split('/').pop()
                  brandFolder.file(`additional-products/${fileName}`, blob, { binary: true })
                } catch (err) {
                  console.error(`Error downloading additional product image for ${product.name}:`, err)
                }
              }
            }
          }
        }

        // Generate and download the zip file
        const content = await zip.generateAsync({ type: 'blob' })
        const url = window.URL.createObjectURL(content)
        const link = document.createElement('a')
        link.href = url
        link.download = `campaign-assets-${campaign.id}.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

      } catch (err) {
        console.error('Error downloading assets:', err)
        error.value = 'Failed to download assets. Please try again.'
      } finally {
        loading.value = false
      }
    }

    const showImagePreview = (page, submission) => {
      previewImage.value = getImageUrl(page.image_url, submission.campaign_id)
      previewImageAlt.value = page.product_name || 'Product image'
    }

    const closePreview = () => {
      previewImage.value = null
      previewImageAlt.value = ''
    }

    const formatNumber = (num) => {
      if (num === null || num === undefined) return '0'
      return num.toLocaleString('en-US')
    }

    const isCampaignActive = (campaign) => {
      // Implement the logic to determine if a campaign is active
      return true // Placeholder, actual implementation needed
    }

    const toggleArchive = async (campaign) => {
      try {
        const { error } = await supabase
          .from('campaigns')
          .update({ archived: !campaign.archived })
          .eq('id', campaign.id)

        if (error) throw error

        // Update local state
        campaign.archived = !campaign.archived
      } catch (err) {
        console.error('Error toggling archive status:', err)
        alert('Failed to update archive status. Please try again.')
      }
    }

    const downloadBrandLogo = async (submission) => {
      try {
        if (!submission.brand_logo_url) {
          alert('No logo available for this brand')
          return
        }

        const logoUrl = getImageUrl(submission.brand_logo_url, submission.campaign_id)
        const response = await fetch(logoUrl)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const blob = await response.blob()
        const fileName = `${sanitize(submission.brand_name)}_logo.${submission.brand_logo_url.split('.').pop()}`
        saveAs(blob, fileName)
      } catch (err) {
        console.error('Error downloading brand logo:', err)
        alert('Failed to download brand logo. Please try again.')
      }
    }

    // Open edit modal and prefill form
    const openEditModal = (submission) => {
      editSubmission.value = submission
      // Deep copy to avoid mutating original until save
      editForm.value = JSON.parse(JSON.stringify(submission))
      editImageFiles.value = {}
      editAdditionalProductImageFiles.value = {}
      showEditModal.value = true
    }
    const closeEditModal = () => {
      showEditModal.value = false
      editSubmission.value = null
      editForm.value = {}
      editImageFiles.value = {}
      editAdditionalProductImageFiles.value = {}
    }

    // Handle image file change for main product
    const handleEditImageChange = (event, pageIdx) => {
      const file = event.target.files[0]
      if (file) {
        editImageFiles.value[pageIdx] = file
      }
    }

    // Handle image file change for additional products
    const handleEditAdditionalProductImageChange = (event, pageIdx, prodIdx) => {
      const file = event.target.files[0]
      if (!editAdditionalProductImageFiles.value[pageIdx]) {
        editAdditionalProductImageFiles.value[pageIdx] = {}
      }
      if (file) {
        editAdditionalProductImageFiles.value[pageIdx][prodIdx] = file
      }
    }

    // Save edits to Supabase
    const saveEditSubmission = async () => {
      try {
        loading.value = true
        error.value = null

        // Upload new images if any exist
        const imageUrls = {}
        for (const pageId in editSubmission.value.selected_pages) {
          const page = editSubmission.value.selected_pages[pageId]
          if (page.newImage) {
            try {
              // Sanitize filename
              const sanitizedFileName = page.newImage.name
                .toLowerCase()
                .replace(/[^a-z0-9.]/g, '-')
                .replace(/\.+/g, '.')
              
              const timestamp = Date.now()
              const fileName = `${timestamp}-${sanitizedFileName}`
              const filePath = `${campaign.value.id}/products/${fileName}`

              const { data: imageData, error: imageError } = await supabase.storage
                .from('product-images')
                .upload(filePath, page.newImage)

              if (imageError) throw imageError

              // Get the public URL
              const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)

              imageUrls[pageId] = publicUrl
            } catch (uploadError) {
              console.error('Error uploading image:', uploadError)
              throw new Error('Failed to upload image: ' + uploadError.message)
            }
          }
        }

        // Update image URLs in the submission data
        for (const pageId in editSubmission.value.selected_pages) {
          if (imageUrls[pageId]) {
            editSubmission.value.selected_pages[pageId].image_url = imageUrls[pageId]
          }
        }

        // Extract additional products from the first page's additional_products array
        const additionalProducts = editSubmission.value.selected_pages[0]?.additional_products || []

        // Update the submission in Supabase
        const { data, error: updateError } = await supabase
          .from('campaign_submissions')
          .update({
            selected_pages: editSubmission.value.selected_pages.map(page => ({
              ...page,
              additional_products: undefined // Remove from selected_pages
            })),
            additional_products: additionalProducts,
            designer_notes: editSubmission.value.designer_notes // Add designer notes to the update
          })
          .eq('id', editSubmission.value.id)
          .select()

        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }

        // Update local state
        const index = submissions.value.findIndex(s => s.id === editSubmission.value.id)
        if (index !== -1) {
          submissions.value[index] = {
            ...submissions.value[index],
            selected_pages: editSubmission.value.selected_pages.map(page => ({
              ...page,
              additional_products: undefined
            })),
            additional_products: additionalProducts,
            designer_notes: editSubmission.value.designer_notes // Update local state with designer notes
          }
        }

        // Close modal and show success message
        showEditModal.value = false
        alert('Changes saved successfully!')
      } catch (err) {
        console.error('Error saving changes:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const isEditingNotes = (submissionId) => {
      return editingNotesId.value === submissionId
    }

    const toggleNotesEdit = (submission) => {
      if (isEditingNotes(submission.id)) {
        editingNotesId.value = null
        editNotes.value[submission.id] = submission.designer_notes || ''
      } else {
        editingNotesId.value = submission.id
        editNotes.value[submission.id] = submission.designer_notes || ''
      }
    }

    const saveDesignerNotes = async (submission) => {
      try {
        const { error } = await supabase
          .from('campaign_submissions')
          .update({
            designer_notes: editNotes.value[submission.id]
          })
          .eq('id', submission.id)

        if (error) throw error

        // Update local state
        submission.designer_notes = editNotes.value[submission.id]
        editingNotesId.value = null
        alert('Designer notes saved!')
      } catch (err) {
        alert('Failed to save designer notes: ' + err.message)
      }
    }

    const filteredSubmissions = (campaign) => {
      if (!selectedBrands.value[campaign.id] || selectedBrands.value[campaign.id] === 'all') {
        return campaign.submissions
      } else {
        return campaign.submissions.filter(submission => submission.id === selectedBrands.value[campaign.id])
      }
    }

    const handleBrandSelection = (campaignId) => {
      // This function is just a placeholder
      // The actual filtering happens in filteredSubmissions
      console.log(`Selected brand changed for campaign ${campaignId} to: ${selectedBrands.value[campaignId]}`)
    }

    // Helper to extract filename from signed URL
    function getFilenameFromUrl(url, fallback, mimeType) {
      try {
        // First try to get the filename from the URL path
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        let filename = pathParts[pathParts.length - 1];
        
        // If the filename contains a timestamp prefix, remove it
        filename = filename.replace(/^\d+-/, '');
        
        // If the filename is missing or has no extension, use fallback
        if (!filename || !/\.[a-z0-9]+$/i.test(filename)) {
          let ext = '';
          if (mimeType) {
            if (mimeType === 'application/pdf') ext = 'pdf';
            else if (mimeType === 'image/png') ext = 'png';
            else if (mimeType === 'image/jpeg') ext = 'jpg';
            else if (mimeType === 'image/gif') ext = 'gif';
            else if (mimeType === 'image/webp') ext = 'webp';
            else if (mimeType === 'application/postscript') ext = 'ai';
            else if (mimeType === 'image/vnd.adobe.photoshop') ext = 'psd';
          }
          filename = fallback + (ext ? `.${ext}` : '');
        }
        
        // For Supabase storage URLs, extract the original filename
        if (url.includes('supabase.co/storage/v1/object/sign/')) {
          // Get the filename from the URL path
          const pathMatch = url.match(/\/sign\/[^/]+\/([^?]+)/);
          if (pathMatch && pathMatch[1]) {
            filename = decodeURIComponent(pathMatch[1]);
            // Remove timestamp prefix if present
            filename = filename.replace(/^\d+-/, '');
          }
        }
        
        // Clean up the filename while preserving spaces and special characters
        filename = filename
          .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid filesystem chars with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
        
        return filename;
      } catch (err) {
        console.error('Error parsing URL:', err);
        // Fallback to a safe filename if URL parsing fails
        return fallback + (mimeType ? `.${mimeType.split('/')[1]}` : '');
      }
    }

    onMounted(() => {
      loadData()
    })

    return {
      loading,
      error,
      searchQuery,
      filteredCampaigns,
      previewImage,
      previewImageAlt,
      showArchived,
      expandedCampaigns,
      toggleCampaign,
      isCampaignExpanded,
      getImageUrl,
      showImagePreview,
      closePreview,
      downloadSingleAsset,
      downloadCampaignAssets,
      toggleDesignStatus,
      formatNumber,
      isCampaignActive,
      toggleArchive,
      downloadBrandLogo,
      isAuthorizedUser,
      showEditModal,
      editForm,
      openEditModal,
      closeEditModal,
      handleEditImageChange,
      handleEditAdditionalProductImageChange,
      editAdditionalProductImageFiles,
      saveEditSubmission,
      editNotes,
      isEditingNotes,
      toggleNotesEdit,
      saveDesignerNotes,
      selectedBrands,
      filteredSubmissions,
      handleBrandSelection
    }
  }
}
</script>

<style scoped>
.asset-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.logo {
  max-width: 150px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-box input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.show-archived {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  cursor: pointer;
}

.show-archived input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.campaign-section {
  margin-bottom: 30px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.campaign-section.archived {
  opacity: 0.7;
}

.campaign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  cursor: pointer;
}

.campaign-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.toggle-icon {
  font-size: 12px;
  color: #666;
  transition: transform 0.2s ease;
}

.assets-list {
  padding: 20px;
}

.submission-sections {
  padding: 15px;
}

.brand-selector {
  margin-bottom: 20px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.brand-selector label {
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
}

.brand-selector select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
  background-color: white;
  cursor: pointer;
}

.submissions-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.submission-section {
  width: 100%;
  margin-bottom: 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.submission-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.products-row {
  display: flex;
  overflow-x: auto;
  padding: 20px;
  gap: 20px;
  scrollbar-width: thin;
}

.products-row::-webkit-scrollbar {
  height: 8px;
}

.products-row::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.products-row::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 4px;
}

.products-row::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

.product-container {
  display: flex;
  flex-direction: row;
  gap: 15px;
  flex: 0 0 auto;
  min-width: 300px;
  max-width: 800px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  padding: 15px;
}

.product-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-product {
  flex: 1;
  min-width: 250px;
  max-width: 350px;
  border-right: 1px dashed #eee;
  padding-right: 15px;
}

.additional-products-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  flex: 1;
  align-content: flex-start;
}

.additional-product {
  flex: 0 0 120px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.additional-product:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.product-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 10px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 5px;
}

.page-number {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9em;
}

.layout-type {
  color: #007bff;
  font-size: 0.8em;
  padding: 3px 6px;
  background: #e7f3ff;
  border-radius: 4px;
}

.product-card-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
}

.product-thumbnail {
  width: 100%;
  height: 180px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
}

.product-thumbnail.sm {
  height: 80px;
}

.product-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-thumbnail:hover img {
  opacity: 0.9;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-info.sm {
  gap: 4px;
}

.product-info.sm .product-name {
  font-size: 0.85em;
  margin: 0;
}

.product-info.sm .price {
  font-size: 0.85em;
}

.product-name {
  font-weight: 600;
  font-size: 1em;
  color: #2c3e50;
  margin: 0;
}

.product-description {
  color: #666;
  font-size: 0.85em;
  line-height: 1.4;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.price {
  color: #28a745;
  font-weight: 600;
  font-size: 1em;
  margin: 0;
}

.chip-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
}

.chip-label {
  font-size: 0.85em;
  font-weight: 600;
  color: #666;
  flex-basis: 100%;
  margin-bottom: 5px;
}

.product-chip {
  padding: 5px 10px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 0.8em;
  color: #333;
  cursor: pointer;
}

.product-chip:hover {
  background: #e0e0e0;
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #666;
  height: 100%;
  width: 100%;
  background: #f8f9fa;
}

.no-image-icon {
  font-size: 1.5em;
  opacity: 0.5;
}

.loading-state {
  text-align: center;
  padding: 40px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  color: #721c24;
  background: #f8d7da;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.status-badge {
  display: none;
}

.status-badge.pending,
.status-badge.approved {
  display: none;
}

.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 80%;
  max-height: 80%;
  overflow: auto;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.campaign-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.campaign-title {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.campaign-badges {
  display: flex;
  align-items: center;
  gap: 10px;
}

.campaign-status {
  font-size: 0.9em;
  padding: 4px 12px;
  border-radius: 20px;
  background: #f8f9fa;
  color: #666;
}

.campaign-status.active {
  background: #e7f7ed;
  color: #28a745;
}

.archive-badge {
  background: #f8f9fa;
  color: #666;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9em;
}

.archive-btn {
  background: #6c757d;
  color: white;
}

.archive-btn:hover {
  background: #5a6268;
}

.archive-btn.unarchive {
  background: #28a745;
}

.archive-btn.unarchive:hover {
  background: #218838;
}

.submission-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.design-status {
  font-size: 0.85em;
  padding: 4px 12px;
  border-radius: 20px;
  background: #f8f9fa;
  color: #666;
}

.design-status.added {
  background: #e7f7ed;
  color: #28a745;
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

.edit-page-form {
  margin-bottom: 2rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.additional-products-edit {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.additional-product-edit {
  margin-bottom: 1.5rem;
}

.additional-product-edit:last-child {
  margin-bottom: 0;
}

hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 1rem 0;
}

.designer-notes-section {
  padding: 15px;
  background: #f8f9fa;
  border-top: 1px solid #ddd;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.notes-header h4 {
  margin: 0;
  color: #2c3e50;
}

.notes-edit textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 10px;
}

.notes-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.notes-display {
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #eee;
}

.notes-content {
  margin: 0;
  white-space: pre-wrap;
  color: #2c3e50;
}

.no-notes {
  margin: 0;
  color: #666;
  font-style: italic;
}

/* Restore necessary styles */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn.primary {
  background: #007bff;
  color: white;
}

.btn.primary:hover {
  background: #0056b3;
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.secondary:hover {
  background: #5a6268;
}

.btn.success {
  background: #28a745;
  color: white;
}

.btn.success:hover {
  background: #218838;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.brand-header {
  display: flex;
  align-items: center;
  gap: 15px;
}

.brand-logo-container {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #eee;
  transition: transform 0.2s ease;
}

.brand-logo-container:hover {
  transform: scale(1.05);
}

.brand-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.brand-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.discount-code {
  color: #4CAF50;
  font-weight: 500;
  margin-top: 8px;
  padding: 4px 8px;
  background-color: #E8F5E9;
  border-radius: 4px;
  display: inline-block;
}
</style> 