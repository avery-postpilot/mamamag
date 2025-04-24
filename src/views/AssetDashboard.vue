<template>
  <div class="asset-dashboard">
    <header class="dashboard-header">
      <div class="header-content">
        <img src="../assets/mamamag-logo.svg" alt="MamaMag Logo" class="logo">
        <h1>Asset Dashboard</h1>
      </div>
      
      <div class="controls">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search brands or products..."
            @input="filterAssets"
          >
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
          <h2>{{ campaign.name }}</h2>
          <div class="campaign-actions">
            <button 
              class="btn primary" 
              @click.stop="downloadCampaignAssets(campaign)"
            >
              Download All
            </button>
            <span class="toggle-icon">{{ isCampaignExpanded(campaign.id) ? '▼' : '▶' }}</span>
          </div>
        </div>

        <div v-if="isCampaignExpanded(campaign.id)" class="assets-list">
          <div 
            v-for="submission in campaign.submissions" 
            :key="submission.id" 
            class="submission-section"
          >
            <div class="submission-header">
              <h3>{{ submission.brand_name }}</h3>
              <div class="submission-actions">
                <button 
                  class="btn" 
                  :class="{ 'success': submission.added_to_design }"
                  @click="toggleDesignStatus(submission)"
                >
                  {{ submission.added_to_design ? '✓ Added to Design' : 'Add to Design' }}
                </button>
              </div>
            </div>

            <div class="pages-list">
              <div 
                v-for="page in submission.selected_pages" 
                :key="page.page_id"
                class="page-item"
              >
                <div class="page-content">
                  <div class="thumbnail-container" @click="showImagePreview(page, submission)">
                    <img 
                      v-if="page.image_url" 
                      :src="getImageUrl(page.image_url, submission.campaign_id)" 
                      :alt="page.product_name || 'Product image'"
                      class="thumbnail"
                    >
                    <div v-else class="no-image">No Image</div>
                  </div>
                  
                  <div class="page-info">
                    <div class="page-header">
                      <span class="page-number">Page {{ page.page_id }}</span>
                      <span class="layout-type">{{ page.layout }}</span>
                    </div>
                    <div class="product-details">
                      <h4 class="product-name">{{ page.product_name || 'N/A' }}</h4>
                      <p class="product-description">{{ page.product_description || 'N/A' }}</p>
                      
                      <!-- Additional Products Section -->
                      <div v-if="page.layout === 'multi-product' && page.additional_products?.length" class="additional-products">
                        <h5>Additional Products</h5>
                        <div v-for="(product, index) in page.additional_products" :key="index" class="additional-product">
                          <div class="product-thumbnail" @click="showImagePreview(product, submission)">
                            <img 
                              v-if="product.image_url" 
                              :src="getImageUrl(product.image_url, submission.campaign_id)" 
                              :alt="product.name || 'Additional product'"
                              class="thumbnail"
                            >
                            <div v-else class="no-image">No Image</div>
                          </div>
                          <div class="product-info">
                            <h6>{{ product.name }}</h6>
                            <p>{{ product.description }}</p>
                            <p class="price">${{ formatNumber(product.price) }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Text Content Section -->
                      <div v-if="page.layout === 'text-image' && page.text_content" class="text-content">
                        <h5>Article Text</h5>
                        <p>{{ page.text_content }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="page-actions">
                    <button 
                      class="btn small" 
                      @click="downloadSingleAsset(page, submission)"
                    >
                      Download
                    </button>
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
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export default {
  name: 'AssetDashboard',
  setup() {
    const loading = ref(true)
    const error = ref(null)
    const submissions = ref([])
    const campaigns = ref([])
    const searchQuery = ref('')
    const expandedCampaigns = ref(new Set())
    const previewImage = ref(null)
    const previewImageAlt = ref('')

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
            added_to_design
          `)
          .order('created_at', { ascending: false })

        if (submissionError) {
          console.error('Error loading submissions:', submissionError)
          throw submissionError
        }

        // Process submissions
        submissions.value = submissionData.map(submission => {
          console.log('Processing submission:', submission.id)
          const processedPages = Array.isArray(submission.selected_pages) 
            ? submission.selected_pages.map(page => {
                console.log('Page image_url:', page.image_url)
                return {
                  ...page,
                  image_url: page.image_url || null
                }
              })
            : []
          return {
            ...submission,
            selected_pages: processedPages
          }
        })

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
      
      campaigns.value.forEach(campaign => {
        groups[campaign.id] = {
          id: campaign.id,
          name: campaign.name,
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
        .sort((a, b) => a.name.localeCompare(b.name))
    })

    // Helper functions
    const getImageUrl = (filename, campaignId) => {
      if (!filename || !campaignId) {
        console.log('Missing filename or campaignId:', { filename, campaignId })
        return null
      }
      
      // If it's already a full URL, return it
      if (filename.startsWith('http')) {
        return filename
      }

      // Clean up the filename to remove any duplicate paths
      const cleanFilename = filename.replace(/^.*?products\//, '')
      
      // Construct the full Supabase URL
      const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${campaignId}/products/${cleanFilename}`
      console.log('Generated image URL:', url)
      return url
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

    const downloadSingleAsset = async (page, submission) => {
      try {
        const zip = new JSZip()
        const campaign = campaigns.value.find(c => c.id === submission.campaign_id)
        const folderName = `${sanitizeFileName(campaign.name)}_${sanitizeFileName(page.page_id)}_${sanitizeFileName(submission.brand_name)}_${sanitizeFileName(page.product_name)}`
        
        // Add copy file with product details
        const copyContent = generatePageCopyContent(page, submission)
        zip.file(`${folderName}/copy.txt`, copyContent)

        // Download and add main product image
        if (page.image_url) {
          try {
            const imageUrl = getImageUrl(page.image_url, submission.campaign_id)
            const response = await fetch(imageUrl)
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const blob = await response.blob()
            const fileName = `${sanitizeFileName(page.product_name)}.${page.image_url.split('.').pop()}`
            zip.file(`${folderName}/${fileName}`, blob)
          } catch (imgError) {
            console.error('Error downloading product image:', imgError)
          }
        }

        // Download and add additional product images
        if (page.layout === 'multi-product' && page.additional_products?.length) {
          for (const [index, product] of page.additional_products.entries()) {
            if (product.image_url) {
              try {
                const imageUrl = getImageUrl(product.image_url, submission.campaign_id)
                const response = await fetch(imageUrl)
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`)
                }
                const blob = await response.blob()
                const fileName = `additional_product_${index + 1}.${product.image_url.split('.').pop()}`
                zip.file(`${folderName}/${fileName}`, blob)
              } catch (imgError) {
                console.error(`Error downloading additional product image ${index + 1}:`, imgError)
              }
            }
          }
        }

        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, `${folderName}.zip`)
      } catch (err) {
        console.error('Error downloading single asset:', err)
        alert('Failed to download asset. Please try again.')
      }
    }

    const downloadCampaignAssets = async (campaign) => {
      try {
        const zip = new JSZip()
        const campaignFolder = zip.folder(sanitizeFileName(campaign.name))
        
        // Add campaign-level copy file
        const campaignCopyContent = `Campaign: ${campaign.name}\n\nSubmissions:\n`
        campaignFolder.file('campaign_info.txt', campaignCopyContent)

        // Process each submission
        for (const submission of campaign.submissions) {
          const submissionFolder = campaignFolder.folder(sanitizeFileName(submission.brand_name))
          
          // Add submission copy
          const copyContent = generateCopyContent(submission)
          submissionFolder.file('submission_info.txt', copyContent)

          // Process each page
          for (const page of submission.selected_pages) {
            const folderName = `${sanitizeFileName(page.page_id)}_${sanitizeFileName(page.product_name)}`
            const pageFolder = submissionFolder.folder(folderName)
            
            // Add page copy with product details
            const pageCopyContent = generatePageCopyContent(page, submission)
            pageFolder.file('copy.txt', pageCopyContent)

            // Download and add product image
            if (page.image_url) {
              try {
                const imageUrl = getImageUrl(page.image_url, submission.campaign_id)
                const response = await fetch(imageUrl)
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
                const blob = await response.blob()
                const fileName = `${sanitizeFileName(campaign.name)}_${sanitizeFileName(page.page_id)}_${sanitizeFileName(submission.brand_name)}_${sanitizeFileName(page.product_name)}.${page.image_url.split('.').pop()}`
                pageFolder.file(fileName, blob)
              } catch (imgError) {
                console.error(`Error downloading image for page ${page.page_id}:`, imgError)
              }
            }
          }
        }

        // Generate and save zip file
        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, `${sanitizeFileName(campaign.name)}_all_assets.zip`)
      } catch (err) {
        console.error('Error creating campaign zip:', err)
        alert('Failed to download campaign assets. Please try again.')
      }
    }

    const generatePageCopyContent = (page, submission) => {
      let content = `Page: ${page.page_id || 'unknown'}
Brand: ${submission.brand_name}
Layout: ${page.layout || 'N/A'}
Reserved By: ${page.reserved_by || 'N/A'}
Product Name: ${page.product_name || 'N/A'}
Description: ${page.product_description || 'N/A'}
`

      // Add additional products if present
      if (page.layout === 'multi-product' && page.additional_products?.length) {
        content += '\nAdditional Products:\n'
        page.additional_products.forEach((product, index) => {
          content += `\nProduct ${index + 1}:
Name: ${product.name || 'N/A'}
Description: ${product.description || 'N/A'}
Price: $${formatNumber(product.price) || 'N/A'}\n`
        })
      }

      // Add text content if present
      if (page.layout === 'text-image' && page.text_content) {
        content += `\nArticle Text:\n${page.text_content}\n`
      }

      return content
    }

    const generateCopyContent = (submission) => {
      return `Brand: ${submission.brand_name}
Contact: ${submission.contact_name}
Email: ${submission.contact_email}
URL: ${submission.brand_website || 'N/A'}
Address: ${submission.mailing_address}
Status: ${submission.status}
`
    }

    const sanitizeFileName = (name) => {
      if (!name) return 'unknown'
      return name.toString().replace(/[^a-z0-9]/gi, '_').toLowerCase()
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
      toggleCampaign,
      isCampaignExpanded,
      getImageUrl,
      showImagePreview,
      closePreview,
      downloadSingleAsset,
      downloadCampaignAssets,
      toggleDesignStatus,
      formatNumber
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

.search-box input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.campaign-section {
  margin-bottom: 30px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
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
  font-size: 20px;
  color: #666;
}

.assets-list {
  padding: 20px;
}

.submission-section {
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
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
}

.pages-list {
  padding: 15px;
}

.page-item {
  margin-bottom: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.page-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.thumbnail-container {
  height: 200px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-image {
  color: #666;
  font-size: 0.9em;
}

.page-info {
  flex: 1;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.page-number {
  font-weight: 600;
  color: #2c3e50;
}

.layout-type {
  color: #007bff;
  font-size: 0.9em;
}

.product-details {
  margin-top: 5px;
}

.product-name {
  font-weight: 500;
  margin-bottom: 5px;
}

.product-description {
  color: #666;
  font-size: 0.9em;
}

.page-actions {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn.primary {
  background: #007bff;
  color: white;
}

.btn.success {
  background-color: #28a745;
  color: white;
}

.btn.success:hover {
  background-color: #218838;
}

.btn.small {
  padding: 4px 8px;
  font-size: 0.9em;
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
</style> 