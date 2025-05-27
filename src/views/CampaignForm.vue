<template>
  <div class="container">
    <header>
      <img src="../assets/mamamag-logo.svg" alt="MamaMag Logo">
      <h1>MamaMag Placement Reservation</h1>
      <p>{{ campaign?.name || 'Loading campaign...' }}</p>
      <div v-if="campaign" class="campaign-details">
        <p><strong>Distribution:</strong> <span>{{ formatNumber(campaign.volume) }}</span> copies</p>
        <p><strong>In-Home Date:</strong> <span>{{ formatDate(campaign.inHomeDate) }}</span></p>
      </div>
    </header>

    <div v-if="loading" class="loader">
      <div class="spinner"></div>
      <p>Loading campaign details...</p>
    </div>

    <div v-else-if="error" class="message error">
      {{ error }}
    </div>

    <div v-else-if="!campaign" class="message error">
      Campaign not found or invalid campaign data.
    </div>

    <div v-else-if="submitted" class="message success">
      Your reservation has been submitted successfully!
    </div>

    <form v-else id="reservation-form" @submit.prevent="submitAssets">
      <!-- Brand Information Section -->
      <div class="card">
        <h2>Brand Information</h2>
        <div class="form-group">
          <label for="brand-name" class="required">Brand Name</label>
          <input type="text" id="brand-name" v-model="formData.brandName" required>
        </div>

        <div class="form-group">
          <label for="contact-name" class="required">Contact Name</label>
          <input type="text" id="contact-name" v-model="formData.contactName" required>
        </div>

        <div class="form-group">
          <label for="contact-email" class="required">Contact Email</label>
          <input type="email" id="contact-email" v-model="formData.contactEmail" required>
        </div>

        <div class="form-group">
          <label for="brand-logo" class="required">Brand Logo</label>
          <div class="file-upload">
            <label for="brand-logo">
              <div class="file-upload-icon">📁</div>
              <p>Click to upload your logo (SVG or PNG)</p>
            </label>
            <input type="file" id="brand-logo" @change="handleLogoUpload" accept=".svg,.png">
          </div>
          <div class="file-list" id="logo-file-list"></div>
        </div>

        <div class="form-group">
          <label for="brand-website" class="required">Brand Website</label>
          <input type="url" id="brand-website" v-model="formData.brandWebsite" placeholder="https://yourbrand.com" required>
        </div>
      </div>

      <!-- Magazine Layout Selection Section -->
      <div class="card">
        <div class="magazine-section">
          <h2>Select Your Placement(s)</h2>
          <p>Choose from our premium cover positions or standard pages with three beautiful layout options to showcase your brand.</p>
          <button @click="showPreview" class="preview-button">Preview MamaMag</button>
        </div>

        <!-- Preview Modal -->
        <div v-if="showPreviewModal" class="preview-modal" @click.self="closePreview">
          <div class="modal-content">
            <button class="close-button" @click="closePreview">&times;</button>
            <MagazineFlipbook />
          </div>
        </div>

        <div class="magazine-layout">
          <div v-for="(row, index) in pageRows" :key="index" :class="['page-row', row.type]">
            <template v-if="row.type === 'single'">
              <div
                :class="{
                  'page': true,
                  'selected': isPageSelected(row.pages[0].id),
                  'page-reserved': !row.pages[0].available
                }"
                @click="handlePageClick(row.pages[0])"
              >
                <div v-if="!row.pages[0].available" class="reserved-badge">
                  Reserved by {{ row.pages[0].reservedBy }}
                </div>
                <div class="page-content">
                  <div class="cover-content">
                    <div class="cover-logo">MAMAMAG</div>
                    <div v-if="row.pages[0].id === 'front-cover'" class="cover-issue">{{ campaign?.name }}</div>
                  </div>
                  <div class="page-info">
                    <div class="page-number">{{ row.pages[0].pageNumber === 'Cover' ? 'Front Cover' : 'Back Cover' }}</div>
                    <div class="page-title">{{ row.pages[0].name }}</div>
                    <div v-if="row.pages[0].type === 'Premium'" class="premium-tag">Premium</div>
                    <div class="page-price">${{ formatNumber(row.pages[0].basePrice) }}</div>
                  </div>
                </div>
              </div>
            </template>
            
            <template v-else-if="row.type === 'center'">
              <div
                :class="{
                  'page': true,
                  'center-spread': true,
                  'selected': isPageSelected(row.pages[0].id),
                  'page-reserved': !row.pages[0].available
                }"
                @click="handlePageClick(row.pages[0])"
              >
                <div v-if="!row.pages[0].available" class="reserved-badge">
                  Reserved by {{ row.pages[0].reservedBy }}
                </div>
                <div class="page-content">
                  <div class="spread-content">
                    <div class="spread-indicator">Center Spread</div>
                  </div>
                  <div class="page-info">
                    <div class="page-number">Pages {{ row.pages[0].pageNumber }}</div>
                    <div class="page-title">{{ row.pages[0].name }}</div>
                    <div v-if="row.pages[0].type === 'Premium'" class="premium-tag">Premium</div>
                    <div class="page-price">${{ formatNumber(row.pages[0].basePrice) }}</div>
                  </div>
                </div>
              </div>
            </template>
            
            <template v-else-if="row.type === 'pair'">
              <div
                v-for="page in row.pages"
                :key="page.id"
                :class="{
                  'page': true,
                  'selected': isPageSelected(page.id),
                  'page-reserved': !page.available
                }"
                @click="handlePageClick(page)"
              >
                <div v-if="!page.available" class="reserved-badge">
                  Reserved by {{ page.reservedBy }}
                </div>
                <div class="page-content">
                  <template v-if="page.id === 'toc'">
                    <div class="toc-content">
                      <div class="toc-header">Table of Contents</div>
                      <div class="toc-lines"></div>
                      <div class="toc-product">Product Feature Slot</div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="standard-page-content">
                      <div class="page-label">{{ page.name }}</div>
                    </div>
                  </template>
                  <div class="page-info">
                    <div class="page-number">Page {{ page.pageNumber }}</div>
                    <div class="page-title">{{ page.name }}</div>
                    <div v-if="page.type === 'Premium'" class="premium-tag">Premium</div>
                    <div class="page-price">${{ formatNumber(page.basePrice) }}</div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Placement Details Modal -->
        <div id="placement-modal" class="modal" v-show="showPlacementModal">
          <div class="modal-content">
            <span class="close-modal" @click="closePlacementModal">&times;</span>
            <div id="placement-details">
              <h3>Selected Pages</h3>
              <div id="selected-pages-list">
                <div v-for="pageId in selectedPages" 
                     :key="pageId" 
                     class="selected-page-item">
                  <div class="page-info">
                    <strong>{{ getPageData(pageId).name }}</strong> 
                    (Page {{ getPageData(pageId).pageNumber }})
                    <span class="page-price">${{ formatNumber(getPagePrice(pageId)) }}</span>
                  </div>
                </div>
              </div>

              <div id="page-product-forms">
                <div v-for="pageId in selectedPages"
                     :key="pageId"
                     class="product-form"
                     :data-page-id="pageId">
                  <h4 class="page-title">{{ getPageData(pageId).name }}</h4>
                  <div class="form-group">
                    <label class="required">Product Name</label>
                    <input type="text" v-model="productForms[pageId].productName" required>
                  </div>
                  <div class="form-group">
                    <label class="required">Product Price</label>
                    <div class="price-input-wrapper">
                      <span class="currency-symbol">$</span>
                      <input type="number" v-model="productForms[pageId].productPrice" min="0" step="0.01" required>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="required">Product Description</label>
                    <textarea v-model="productForms[pageId].productDescription" rows="3" required></textarea>
                    <div class="char-counter">{{ productForms[pageId].productDescription?.length || 0 }}/75 characters</div>
                  </div>
                  <div class="form-group">
                    <label>Discount/Coupon Code</label>
                    <input 
                      type="text" 
                      v-model="productForms[pageId].discountCode"
                      placeholder="Optional: Add a discount or coupon code"
                    >
                  </div>
                  <div class="form-group">
                    <label :for="'product-images-' + pageId" class="required">Product Images</label>
                    <div class="file-upload">
                      <input 
                        type="file" 
                        :id="'product-images-' + pageId" 
                        @change="handleProductImageUpload($event, pageId)" 
                        accept=".png,.jpg,.jpeg"
                        style="display: none;"
                      >
                      <label :for="'product-images-' + pageId" class="upload-label">
                        <div class="file-upload-icon">📁</div>
                        <p>Click to upload product images (PNG or JPG)</p>
                      </label>
                    </div>
                    <div class="file-list"></div>
                  </div>
                  <div class="form-group">
                    <label class="required">Layout Option</label>
                    <select v-model="productForms[pageId].layout" required @change="handleLayoutChange(pageId)">
                      <option value="">Select a layout...</option>
                      <option value="full-page">Full Page Image</option>
                      <option value="multi-product">Multiple Products</option>
                      <option value="text-image">Text with Image</option>
                    </select>
                  </div>

                  <!-- Multiple Products Section -->
                  <div v-if="productForms[pageId].layout === 'multi-product'" class="additional-products-section">
                    <h4>Additional Products</h4>
                    <div v-for="(product, index) in productForms[pageId].additionalProducts" :key="index" class="additional-product">
                      <div class="form-group">
                        <label :class="{ required: index === 0 }">Product Name</label>
                        <input type="text" v-model="product.name" :required="index === 0">
                      </div>
                      <div class="form-group">
                        <label :class="{ required: index === 0 }">Product Price</label>
                        <div class="price-input-wrapper">
                          <span class="currency-symbol">$</span>
                          <input 
                            type="number" 
                            v-model="product.price" 
                            min="0" 
                            step="0.01" 
                            :required="index === 0"
                            :name="'additional-product-price-' + pageId + '-' + index"
                          >
                        </div>
                      </div>
                      <div class="form-group">
                        <label :class="{ required: index === 0 }">Product Description</label>
                        <textarea v-model="product.description" rows="2" :required="index === 0"></textarea>
                        <div class="char-counter">{{ product.description?.length || 0 }}/75 characters</div>
                      </div>
                      <div class="form-group">
                        <label :class="{ required: index === 0 }">Product Image</label>
                        <div class="file-upload">
                          <input 
                            type="file" 
                            :id="'additional-product-image-' + pageId + '-' + index"
                            @change="handleAdditionalProductImageUpload($event, pageId, index)"
                            accept=".png,.jpg,.jpeg"
                            style="display: none;"
                          >
                          <label :for="'additional-product-image-' + pageId + '-' + index" class="upload-label">
                            <div class="file-upload-icon">📁</div>
                            <p>Click to upload product image (PNG or JPG)</p>
                          </label>
                        </div>
                        <div class="file-list"></div>
                      </div>
                      <button 
                        type="button" 
                        class="btn btn-secondary remove-product-btn"
                        @click="removeAdditionalProduct(pageId, index)"
                        v-if="index > 0"
                      >
                        Remove Product
                      </button>
                    </div>
                    <button 
                      type="button" 
                      class="btn btn-secondary add-product-btn"
                      @click="addAdditionalProduct(pageId)"
                      v-if="productForms[pageId].additionalProducts.length < 3"
                    >
                      + Add Product
                    </button>
                  </div>

                  <!-- Text with Image Section -->
                  <div v-if="productForms[pageId].layout === 'text-image'" class="text-content-section">
                    <div class="form-group">
                      <label class="required">Article Text</label>
                      <textarea 
                        v-model="productForms[pageId].textContent" 
                        rows="6" 
                        required
                        placeholder="Enter your article text (up to 700 characters)"
                      ></textarea>
                      <div class="char-counter">{{ productForms[pageId].textContent?.length || 0 }}/700 characters</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="btn-group">
                <button type="button" class="btn btn-secondary" @click="closePlacementModal">Cancel</button>
                <button type="button" class="btn" @click="addPlacements">Add Placements</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Section -->
      <div class="card summary-section">
        <h2>Your Selected Placements</h2>
        <div class="pricing-notice">
          <p><strong>Please Note:</strong> The prices shown are suggested prices based on our standard rate card. You will not be charged by submitting this reservation.</p>
        </div>

        <div id="empty-selection-message" v-if="!selectedPages.length">
          <p>No placements selected yet. Click on a page in the magazine layout above to add a placement.</p>
        </div>

        <table class="summary-table" v-else id="summary-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Placement Type</th>
              <th>Product</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="summary-body">
            <tr v-for="pageId in selectedPages" :key="pageId">
              <td>{{ getPageData(pageId).name }} (Page {{ getPageData(pageId).pageNumber }})</td>
              <td>{{ productForms[pageId].layout }}</td>
              <td>{{ productForms[pageId].productName }}</td>
              <td>${{ formatNumber(getPagePrice(pageId)) }}</td>
              <td>
                <button type="button" class="btn btn-secondary" @click="removePlacement(pageId)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="summary-total" v-if="selectedPages.length">
          Total: <span>${{ formatNumber(totalPrice) }}</span>
        </div>

        <div class="btn-group">
          <button type="submit" class="btn" :disabled="loading || !selectedPages.length">
            Submit Reservation
          </button>
        </div>
      </div>
    </form>

    <div class="selected-count" v-show="selectedPages.length">
      <span>{{ selectedPages.length }}</span> pages selected
      <button class="btn" @click="showPlacementModal = true">View Selected</button>
    </div>

    <!-- Details Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <span class="close-modal" @click="closeModal">&times;</span>
        <h2>Selected Placements</h2>

        <div class="selected-pages-list">
          <div v-for="page in selectedPages" :key="page.id" class="selected-page-item">
            <h3>{{ page.name }} (Page {{ page.pageNumber }})</h3>
            <p>Layout: {{ page.selectedLayout || 'Full Page' }}</p>
            <p class="price">Price: ${{ formatNumber(page.basePrice + (page.additionalPremium || 0)) }}</p>
          </div>
        </div>

        <div class="total-price">
          Total: ${{ formatNumber(calculateTotalPrice()) }}
        </div>

        <form @submit.prevent="submitReservation" class="product-form">
          <div class="form-group">
            <label for="productName">Product Name</label>
            <input
              type="text"
              id="productName"
              v-model="formData.productName"
              required
              maxlength="100"
            />
            <div class="char-counter">{{ formData.productName.length }}/100</div>
          </div>

          <div class="form-group">
            <label for="productDescription">Product Description</label>
            <textarea
              id="productDescription"
              v-model="formData.productDescription"
              required
              maxlength="500"
            ></textarea>
            <div class="char-counter">{{ formData.productDescription.length }}/500</div>
          </div>

          <div class="form-group">
            <label for="productImage">Product Image</label>
            <input
              type="file"
              id="productImage"
              @change="handleImageUpload"
              accept="image/*"
              required
            />
          </div>

          <div class="form-actions">
            <button type="button" class="secondary-button" @click="closeModal">Cancel</button>
            <button type="submit" class="primary-button">Submit Reservation</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase, checkStorage } from '@/lib/supabaseClient'
import MagazineFlipbook from '@/components/magazine/MagazineFlipbook.vue'

export default {
  name: 'CampaignForm',
  components: {
    MagazineFlipbook
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    const campaign = ref(null)
    const loading = ref(true)
    const error = ref(null)
    const submitted = ref(false)
    const showPreviewModal = ref(false)
    const showPlacementModal = ref(false)
    const selectedPages = ref([])
    const productForms = ref({})
    const showModal = ref(false)
    const reservedPages = ref(new Map())
    const magazineData = ref({
      pages: []
    })
    const formData = ref({
      brandName: '',
      contactName: '',
      contactEmail: '',
      brandWebsite: '',
      brandLogo: null,
      brandLogoUrl: null,
      selectedPages: [],
      totalPrice: 0
    })

    const layoutOptions = {
      fullPage: {
        id: 'full-page',
        title: 'Full Page Image',
        description: 'One large impactful image with minimal text',
        icon: '🖼️',
        preview: 'layout-full-page'
      },
      multiProduct: {
        id: 'multi-product',
        title: 'Multiple Products',
        description: 'Showcase up to 4 products with details',
        icon: '🏷️',
        preview: 'layout-multi-product'
      },
      textImage: {
        id: 'text-image',
        title: 'Text with Image',
        description: 'Article-style layout with text and images',
        icon: '📝',
        preview: 'layout-text-image'
      }
    }

    const totalPrice = computed(() => {
      return selectedPages.value.reduce((total, pageId) => {
        const page = getPageData(pageId)
        return total + (page.basePrice + (page.additionalPremium || 0))
      }, 0)
    })

    const pageRows = computed(() => {
      if (!campaign.value) return []

      const rows = []
      const totalPages = parseInt(campaign.value.pageCount)
      
      // Validate total pages is a multiple of 4 between 16 and 36
      if (!totalPages || totalPages < 16 || totalPages > 36 || totalPages % 4 !== 0) {
        console.error('Invalid page count. Must be a multiple of 4 between 16 and 36.')
        return []
      }

      const centerSpreadStart = totalPages / 2 // This will give us the center spread starting page
      const pricing = campaign.value.pricing || {}

      // Front Cover
      rows.push({
        type: 'single',
        pages: [{
          id: 'front-cover',
          pageNumber: 'Cover',
          name: 'Front Cover',
          type: 'Premium',
          basePrice: pricing.frontCover,
          available: !reservedPages.value.has('front-cover'),
          reservedBy: reservedPages.value.get('front-cover'),
          layoutOptions: false
        }]
      })

      // Front Inside Cover and TOC (pages 2-3)
      rows.push({
        type: 'pair',
        pages: [
          {
            id: 'front-inside-cover',
            pageNumber: '2',
            name: 'Front Inside Cover',
            type: 'Premium',
            basePrice: Number(pricing.frontInsideCover || 0),
            available: !reservedPages.value.has('front-inside-cover'),
            reservedBy: reservedPages.value.get('front-inside-cover'),
            layoutOptions: false
          },
          {
            id: 'toc',
            pageNumber: '3',
            name: 'Table of Contents',
            type: 'Premium',
            basePrice: Number(pricing.tocPlacement || 0),
            available: !reservedPages.value.has('toc'),
            reservedBy: reservedPages.value.get('toc'),
            layoutOptions: false
          }
        ]
      })

      // Standard Pages before center spread
      let currentPage = 4 // Start after TOC
      while (currentPage < centerSpreadStart) {
        rows.push({
          type: 'pair',
          pages: [
            {
              id: `page-${currentPage}`,
              pageNumber: currentPage.toString(),
              name: `Page ${currentPage}`,
              type: 'Standard',
              basePrice: Number(pricing.standardPage || 0),
              available: !reservedPages.value.has(`page-${currentPage}`),
              reservedBy: reservedPages.value.get(`page-${currentPage}`),
              layoutOptions: true
            },
            {
              id: `page-${currentPage + 1}`,
              pageNumber: (currentPage + 1).toString(),
              name: `Page ${currentPage + 1}`,
              type: 'Standard',
              basePrice: Number(pricing.standardPage || 0),
              available: !reservedPages.value.has(`page-${currentPage + 1}`),
              reservedBy: reservedPages.value.get(`page-${currentPage + 1}`),
              layoutOptions: true
            }
          ]
        })
        currentPage += 2
      }

      // Center Spread (counts as 2 pages)
      rows.push({
        type: 'center',
        pages: [{
          id: `spread-${centerSpreadStart}-${centerSpreadStart + 1}`,
          pageNumber: `${centerSpreadStart}-${centerSpreadStart + 1}`,
          name: 'Center Spread',
          type: 'Premium',
          basePrice: Number(pricing.centerSpread || 0),
          available: !reservedPages.value.has(`spread-${centerSpreadStart}-${centerSpreadStart + 1}`),
          reservedBy: reservedPages.value.get(`spread-${centerSpreadStart}-${centerSpreadStart + 1}`),
          layoutOptions: false
        }]
      })

      // Standard Pages after center spread
      currentPage = centerSpreadStart + 2 // Start after center spread
      const lastStandardPage = totalPages - 3 // Stop before back inside cover (page 18 in a 20-page magazine)
      while (currentPage <= lastStandardPage) {
        rows.push({
          type: 'pair',
          pages: [
            {
              id: `page-${currentPage}`,
              pageNumber: currentPage.toString(),
              name: `Page ${currentPage}`,
              type: 'Standard',
              basePrice: Number(pricing.standardPage || 0),
              available: !reservedPages.value.has(`page-${currentPage}`),
              reservedBy: reservedPages.value.get(`page-${currentPage}`),
              layoutOptions: true
            },
            {
              id: `page-${currentPage + 1}`,
              pageNumber: (currentPage + 1).toString(),
              name: `Page ${currentPage + 1}`,
              type: 'Standard',
              basePrice: Number(pricing.standardPage || 0),
              available: !reservedPages.value.has(`page-${currentPage + 1}`),
              reservedBy: reservedPages.value.get(`page-${currentPage + 1}`),
              layoutOptions: true
            }
          ]
        })
        currentPage += 2
      }

      // Last standard page and Back Inside Cover
      rows.push({
        type: 'pair',
        pages: [
          {
            id: `page-${totalPages - 2}`,
            pageNumber: (totalPages - 2).toString(), // Page 18 in a 20-page magazine
            name: `Page ${totalPages - 2}`,
            type: 'Standard',
            basePrice: Number(pricing.standardPage || 0),
            available: !reservedPages.value.has(`page-${totalPages - 2}`),
            reservedBy: reservedPages.value.get(`page-${totalPages - 2}`),
            layoutOptions: true
          },
          {
            id: 'back-inside-cover',
            pageNumber: (totalPages - 1).toString(), // Page 19 in a 20-page magazine
            name: 'Back Inside Cover',
            type: 'Premium',
            basePrice: Number(pricing.backInsideCover || 0),
            available: !reservedPages.value.has('back-inside-cover'),
            reservedBy: reservedPages.value.get('back-inside-cover'),
            layoutOptions: false
          }
        ]
      })

      // Back Cover - Always reserved for brand logos
      rows.push({
        type: 'single',
        pages: [{
          id: 'back-cover',
          pageNumber: totalPages,
          name: 'Back Cover',
          type: 'Premium',
          basePrice: pricing.backCover,
          available: false,
          reservedBy: 'Reserved for Brand Logos',
          layoutOptions: false
        }]
      })

      return rows
    })

    const loadPrefilledData = () => {
      // First check localStorage for saved brand info
      const savedBrandInfo = localStorage.getItem('brandInfo')
      if (savedBrandInfo) {
        const brandInfo = JSON.parse(savedBrandInfo)
        formData.value.brandName = brandInfo.brandName || ''
        formData.value.contactName = brandInfo.contactName || ''
        formData.value.contactEmail = brandInfo.contactEmail || ''
        formData.value.brandWebsite = brandInfo.brandWebsite || ''
        // Note: We can't restore the logo file, but we can show a message
        if (brandInfo.brandLogoUrl) {
          alert('Your previously uploaded logo is available. Please upload it again if needed.')
        }
      }

      // Then check URL query parameters (these will override localStorage values)
      const query = route.query
      if (query.brandName) formData.value.brandName = query.brandName
      if (query.contactName) formData.value.contactName = query.contactName
      if (query.contactEmail) formData.value.contactEmail = query.contactEmail
      if (query.brandWebsite) formData.value.brandWebsite = query.brandWebsite
    }

    const loadCampaign = async () => {
      try {
        loading.value = true
        error.value = null
        console.log('Loading campaign with ID:', route.params.id)

        if (!route.params.id) {
          throw new Error('No campaign ID provided')
        }

        // Fetch campaign data with submissions
        const { data, error: err } = await supabase
          .from('campaigns')
          .select(`
            *,
            campaign_submissions(
              id,
              brand_name,
              selected_pages
            )
          `)
          .eq('id', route.params.id)
          .single()

        if (err) {
          console.error('Supabase error:', err)
          throw err
        }

        if (!data) {
          throw new Error('Campaign not found')
        }

        console.log('Campaign data loaded:', data)

        // Get all submissions
        const submissions = data.campaign_submissions || []
        console.log('Campaign submissions:', submissions)

        // Clear existing reservations
        reservedPages.value.clear()

        // Process submissions to build reservations map
        submissions.forEach(submission => {
          if (submission.selected_pages) {
            submission.selected_pages.forEach(page => {
              console.log('Processing reservation:', page)
              if (page.page_id) {
                reservedPages.value.set(page.page_id, submission.brand_name)
              }
            })
          }
        })

        console.log('Reserved pages map:', Object.fromEntries(reservedPages.value))

        // Set up default pricing structure
        const defaultPricing = {
          frontCover: 7500,
          backCover: 7500,
          frontInsideCover: 5000,
          backInsideCover: 5000,
          tocPlacement: 3500,
          centerSpread: 8500,
          standardPage: 3000
        }

        // Merge existing pricing with defaults
        const pricing = {
          ...defaultPricing,
          ...(data.pricing || {})
        }

        campaign.value = {
          id: data.id,
          name: data.name || '',
          description: data.description || '',
          inHomeDate: data.in_home_date,
          assetDueDate: data.asset_due_date,
          volume: parseInt(data.volume) || 0,
          audience: data.audience || '',
          pageCount: parseInt(data.page_count) || 0,
          pricing: pricing,
          submissions: submissions
        }

        // Generate pages array
        const pages = []
        const totalPages = campaign.value.pageCount

        if (!totalPages || totalPages < 4) {
          throw new Error('Invalid page count. Minimum 4 pages required.')
        }

        // Front Cover
        const frontCover = {
          id: 'front-cover',
          pageNumber: 'Cover',
          name: 'Front Cover',
          type: 'Premium',
          basePrice: pricing.frontCover,
          available: !reservedPages.value.has('front-cover'),
          reservedBy: reservedPages.value.get('front-cover')
        }
        pages.push(frontCover)
        console.log('Front Cover status:', frontCover)

        // Front Inside Cover
        const frontInsideCover = {
          id: 'front-inside-cover',
          pageNumber: '1',
          name: 'Front Inside Cover',
          type: 'Premium',
          basePrice: pricing.frontInsideCover,
          available: !reservedPages.value.has('front-inside-cover'),
          reservedBy: reservedPages.value.get('front-inside-cover')
        }
        pages.push(frontInsideCover)
        console.log('Front Inside Cover status:', frontInsideCover)

        // Table of Contents
        const toc = {
          id: 'toc',
          pageNumber: '2',
          name: 'Table of Contents',
          type: 'Premium',
          basePrice: pricing.tocPlacement,
          available: !reservedPages.value.has('toc'),
          reservedBy: reservedPages.value.get('toc')
        }
        pages.push(toc)
        console.log('TOC status:', toc)

        // Update magazine data with the generated pages
        magazineData.value = {
          pages: pages
        }
        console.log('Final magazine data:', magazineData.value)

      } catch (err) {
        console.error('Detailed error in loadCampaign:', err)
        error.value = `Error loading campaign: ${err.message}`
      } finally {
        loading.value = false
      }
    }

    const selectPage = (page) => {
      if (!page.available) return

      const index = selectedPages.value.indexOf(page.id)
      if (index === -1) {
        selectedPages.value.push(page.id)
        // Initialize product form for this page
        initializeProductForm(page.id)
        showPlacementModal.value = true
      } else {
        selectedPages.value.splice(index, 1)
        delete productForms.value[page.id]
      }
    }

    const selectLayout = (page, layoutId) => {
      if (productForms.value[page.id]) {
        productForms.value[page.id].layout = layoutId
      }
    }

    const getPageData = (pageId) => {
      for (const row of pageRows.value) {
        const page = row.pages.find(p => p.id === pageId)
        if (page) return page
      }
      return null
    }

    const getPagePrice = (pageId) => {
      const page = getPageData(pageId)
      return page ? Number(page.basePrice) : 0
    }

    const initializeProductForm = (pageId) => {
      productForms.value[pageId] = {
        productName: '',
        productDescription: '',
        productImages: [],
        productPrice: '',
        layout: '',
        additionalProducts: [],
        textContent: '',
        discountCode: ''
      }
    }

    const handleProductImageUpload = async (event, pageId) => {
      const files = event.target.files
      if (!files.length) return

      // Store the files in the productForms state
      productForms.value[pageId].productImages = Array.from(files)

      // Update the file list display
      const fileList = event.target.parentElement.nextElementSibling
      fileList.innerHTML = Array.from(files)
        .map(file => `<div class="file-item">${file.name}</div>`)
        .join('')
    }

    const handleLogoUpload = (event) => {
      const file = event.target.files[0]
      if (!file) return

      formData.value.brandLogo = file

      // Update the file list display
      const fileList = document.getElementById('logo-file-list')
      fileList.innerHTML = `<div class="file-item">${file.name}</div>`
    }

    const removePlacement = (pageId) => {
      const index = selectedPages.value.indexOf(pageId)
      if (index !== -1) {
        selectedPages.value.splice(index, 1)
        delete productForms.value[pageId]
      }
    }

    const addPlacements = () => {
      // Validate forms
      const isValid = selectedPages.value.every(pageId => {
        const form = productForms.value[pageId]
        return form.productName && 
               form.productPrice && 
               form.productDescription && 
               form.productImages?.length > 0 &&
               form.layout
      })

      if (!isValid) {
        alert('Please fill in all required fields and upload at least one product image for each placement.')
        return
      }

      showPlacementModal.value = false
    }

    const closePlacementModal = () => {
      showPlacementModal.value = false
    }

    const uploadProductImage = async (file, pageId) => {
      try {
        // Sanitize the filename
        const sanitizedFileName = file.name
          .toLowerCase()
          .replace(/[^a-z0-9.]/g, '-')
          .replace(/\.+/g, '.')
        
        const timestamp = Date.now()
        const fileName = `${timestamp}-${sanitizedFileName}`
        const filePath = `${campaign.value.id}/products/${fileName}`
        
        const { data: imageData, error: imageError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (imageError) {
          console.error('Product image upload error:', imageError)
          throw new Error(`Product image upload failed: ${imageError.message}`)
        }

        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        return publicUrl
      } catch (err) {
        console.error('Product image upload error:', err)
        throw new Error(`Product image upload failed: ${err.message}`)
      }
    }

    const submitAssets = async () => {
      try {
        loading.value = true
        error.value = null

        // Validate required fields
        if (!formData.value || !formData.value.contactEmail) {
          throw new Error('Contact email is required')
        }

        // First, check if brand exists
        const { data: existingBrand, error: searchError } = await supabase
          .from('brands')
          .select()
          .eq('contactEmail', formData.value.contactEmail)
          .single()

        if (searchError && searchError.code !== 'PGRST116') {
          console.error('Search error:', searchError)
          throw searchError
        }

        let brandData
        if (existingBrand) {
          // Update existing brand
          const { data: updatedBrand, error: updateError } = await supabase
            .from('brands')
            .update({
              name: formData.value.brandName,
              contactName: formData.value.contactName
            })
            .eq('id', existingBrand.id)
            .select()
            .single()

          if (updateError) {
            console.error('Update error:', updateError)
            throw updateError
          }
          brandData = updatedBrand
        } else {
          // Insert new brand
          const { data: newBrand, error: insertError } = await supabase
            .from('brands')
            .insert({
              name: formData.value.brandName,
              contactName: formData.value.contactName,
              contactEmail: formData.value.contactEmail
            })
            .select()
            .single()

          if (insertError) {
            console.error('Insert error:', insertError)
            throw insertError
          }
          brandData = newBrand
        }

        // Upload logo first if provided
        let brandLogoUrl = null
        if (formData.value.brandLogo) {
          try {
            // Sanitize filename
            const sanitizedFileName = formData.value.brandLogo.name
              .toLowerCase()
              .replace(/[^a-z0-9.]/g, '-')
              .replace(/\.+/g, '.')
            
            const timestamp = Date.now()
            const fileName = `${timestamp}-${sanitizedFileName}`
            const filePath = `${campaign.value.id}/logos/${fileName}`

            // Upload using the correct path structure
            const { data: logoData, error: logoError } = await supabase.storage
              .from('brand-logos')
              .upload(filePath, formData.value.brandLogo, {
                cacheControl: '3600',
                upsert: false
              })

            if (logoError) throw logoError

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
              .from('brand-logos')
              .getPublicUrl(filePath)

            brandLogoUrl = publicUrl
          } catch (uploadError) {
            console.error('Error uploading logo:', uploadError)
            throw new Error('Failed to upload brand logo: ' + uploadError.message)
          }
        }

        // Save brand info to localStorage for future forms
        localStorage.setItem('brandInfo', JSON.stringify({
          brandName: formData.value.brandName,
          contactName: formData.value.contactName,
          contactEmail: formData.value.contactEmail,
          brandWebsite: formData.value.brandWebsite,
          brandLogoUrl: brandLogoUrl
        }))

        // Process all pages and their products
        const selectedPagesData = []
        const additionalProductsData = []
        
        for (const pageId of selectedPages.value) {
          const form = productForms.value[pageId]
          const pageData = {
            page_id: pageId,
            layout: form.layout,
            product_name: form.productName,
            product_description: form.productDescription,
            product_price: parseFloat(form.productPrice),
            discount_code: form.discountCode,
            image_url: null
          }

          // Upload main product image
          if (form.productImages && form.productImages.length > 0) {
            const imageUrl = await uploadProductImage(form.productImages[0], pageId)
            pageData.image_url = imageUrl
          }

          // Process additional products for multi-product layouts
          if (form.layout === 'multi-product' && form.additionalProducts) {
            const additionalProducts = []
            for (const additionalProduct of form.additionalProducts) {
              if (additionalProduct.name && additionalProduct.price && additionalProduct.description) {
                const additionalProductData = {
                  name: additionalProduct.name,
                  price: parseFloat(additionalProduct.price),
                  description: additionalProduct.description,
                  image: { url: null }
                }

                // Upload additional product image if available
                if (additionalProduct.image && additionalProduct.image.file) {
                  const additionalImageUrl = await uploadProductImage(additionalProduct.image.file, `${pageId}-additional-${Date.now()}`)
                  additionalProductData.image.url = additionalImageUrl
                }

                additionalProducts.push(additionalProductData)
                additionalProductsData.push(additionalProductData)
              }
            }
            pageData.additional_products = additionalProducts
          }

          selectedPagesData.push(pageData)
        }

        const submissionData = {
          campaign_id: campaign.value.id,
          brand_name: formData.value.brandName,
          contact_name: formData.value.contactName,
          contact_email: formData.value.contactEmail,
          brand_url: formData.value.brandWebsite,
          brand_logo_url: brandLogoUrl,
          page_id: selectedPagesData[0].page_id,
          selected_pages: selectedPagesData,
          additional_products: additionalProductsData,
          total_price: calculateTotalPrice(),
          status: 'pending',
          added_to_design: false
        }

        // Insert the submission into the database
        const { data, error: dbError } = await supabase
          .from('campaign_submissions')
          .insert(submissionData)
          .select()

        if (dbError) {
          console.error('Error inserting submission:', dbError)
          throw dbError
        }

        // Show success message and reset form
        alert('Reservation submitted successfully!')
        selectedPages.value = []
        formData.value = {
          brandName: '',
          contactName: '',
          contactEmail: '',
          brandWebsite: '',
          brandLogo: null
        }
        productForms.value = {}
        closeModal()

      } catch (err) {
        console.error('Submission error:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
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

    const calculateTotalPrice = () => {
      return selectedPages.value.reduce((total, pageId) => {
        return total + getPagePrice(pageId)
      }, 0)
    }

    const submitReservation = async () => {
      try {
        loading.value = true
        error.value = null

        // Process additional products for multi-product layouts
        for (const pageId of selectedPages.value) {
          const form = productForms.value[pageId]
          if (form.layout === 'multi-product' && form.additionalProducts) {
            // Ensure each additional product has its image URL stored
            form.additionalProducts = form.additionalProducts.map(product => ({
              name: product.name,
              price: parseFloat(product.price),
              description: product.description,
              image: product.image ? {
                url: product.image.url
              } : null
            }))
          }
        }

        const submissionData = {
          campaign_id: campaign.value.id,
          brand_name: formData.value.brandName,
          contact_name: formData.value.contactName,
          contact_email: formData.value.contactEmail,
          brand_url: formData.value.brandWebsite,
          brand_logo_url: brandLogoUrl,
          selected_pages: selectedPages.value.map(pageId => ({
            page_id: pageId,
            layout: productForms.value[pageId].layout,
            product_name: productForms.value[pageId].productName,
            product_description: productForms.value[pageId].productDescription,
            product_price: parseFloat(productForms.value[pageId].productPrice),
            discount_code: productForms.value[pageId].discountCode,
            image_url: null // Will be updated after image upload
          })),
          total_price: calculateTotalPrice(),
          status: 'pending',
          layout_type: productForms.value[selectedPages.value[0]].layout,
          page_id: selectedPages.value[0],
          added_to_design: false,
          additional_products: productForms.value[selectedPages.value[0]].additionalProducts || [],
          text_content: productForms.value[selectedPages.value[0]].textContent || null
        }

        // Upload images first
        try {
          for (const pageId of selectedPages.value) {
            const form = productForms.value[pageId]
            if (form.productImages && form.productImages.length > 0) {
              const imageUrl = await uploadProductImage(form.productImages[0], pageId)
              const pageIndex = submissionData.selected_pages.findIndex(p => p.page_id === pageId)
              if (pageIndex !== -1) {
                submissionData.selected_pages[pageIndex].image_url = imageUrl
              }
            }
          }

          // Insert the submission into the database
          const { data, error: dbError } = await supabase
            .from('campaign_submissions')
            .insert(submissionData)
            .select()

          if (dbError) throw dbError

          // Show success message and reset form
          alert('Reservation submitted successfully!')
          selectedPages.value = []
          formData.value = {
            brandName: '',
            contactName: '',
            contactEmail: '',
            brandWebsite: '',
            brandLogo: null
          }
          productForms.value = {}
          closeModal()

        } catch (err) {
          console.error('Error submitting reservation:', err)
          throw new Error(`Failed to submit reservation: ${err.message}`)
        }
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const handleImageUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        formData.value.productImage = file
      }
    }

    const closeModal = () => {
      showModal.value = false
    }

    const getPage = (pageId) => {
      return magazineData.value.pages.find(p => p.id === pageId)
    }

    const getInsidePages = () => {
      return magazineData.value.pages.filter(page => 
        !['front-cover', 'back-cover'].includes(page.id)
      )
    }

    const isPageSelected = (pageId) => {
      return selectedPages.value.includes(pageId)
    }

    const isPageReserved = (pageId) => {
      const page = magazineData.value.pages.find(p => p.id === pageId)
      return page ? !page.available : false
    }

    const getReservedByBrand = (pageId) => {
      const page = magazineData.value.pages.find(p => p.id === pageId)
      return page ? page.reservedBy : null
    }

    const handlePageClick = (page) => {
      // Prevent clicking on back cover
      if (page.id === 'back-cover') {
        alert('The back cover is reserved for brand logos and cannot be selected.')
        return
      }

      if (!page.available) {
        alert(`This page has been reserved by ${page.reservedBy} and is unavailable for this campaign.`)
        return
      }
      
      if (isPageSelected(page.id)) {
        if (confirm('Are you sure you want to deselect this page? You will lose this page\'s assets and copy.')) {
          removePlacement(page.id)
        }
      } else {
        selectPage(page)
      }
    }

    const handleLayoutChange = (pageId) => {
      const form = productForms.value[pageId]
      if (form.layout === 'multi-product') {
        if (!form.additionalProducts) {
          form.additionalProducts = [{
            name: '',
            price: '',
            description: '',
            image: null
          }]
        }
      } else if (form.layout === 'text-image') {
        if (!form.textContent) {
          form.textContent = ''
        }
      }
    }

    const addAdditionalProduct = (pageId) => {
      const form = productForms.value[pageId]
      if (!form.additionalProducts) {
        form.additionalProducts = []
      }
      if (form.additionalProducts.length < 3) {
        form.additionalProducts.push({
          name: '',
          price: '',
          description: '',
          image: null
        })
      }
    }

    const removeAdditionalProduct = (pageId, index) => {
      const form = productForms.value[pageId]
      if (form.additionalProducts && form.additionalProducts.length > 1) {
        form.additionalProducts.splice(index, 1)
      }
    }

    const handleAdditionalProductImageUpload = async (event, pageId, index) => {
      const files = event.target.files
      if (!files.length) return

      const form = productForms.value[pageId]
      if (!form.additionalProducts) {
        form.additionalProducts = []
      }

      try {
        // Upload the image to Supabase storage
        const file = files[0]
        // Sanitize the filename - remove spaces and special characters
        const sanitizedFileName = file.name
          .toLowerCase()
          .replace(/[^a-z0-9.]/g, '-')
          .replace(/\.+/g, '.') // Replace multiple dots with single dot
        
        const timestamp = Date.now()
        const fileName = `${timestamp}-${sanitizedFileName}`
        const filePath = `${campaign.value.id}/products/${fileName}`
        
        const { data: imageData, error: imageError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (imageError) {
          console.error('Additional product image upload error:', imageError)
          throw new Error(`Additional product image upload failed: ${imageError.message}`)
        }

        if (!imageData?.path) {
          throw new Error('Additional product image upload failed: No path returned from storage')
        }

        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        // Store the file and its URL in the form data
        form.additionalProducts[index].image = {
          file: file,
          url: publicUrl
        }

        // Update the file list display
        const fileList = event.target.parentElement.nextElementSibling
        fileList.innerHTML = `<div class="file-item">${file.name}</div>`
      } catch (err) {
        console.error('Error uploading additional product image:', err)
        alert('Failed to upload image. Please try again.')
      }
    }

    const showPreview = () => {
      showPreviewModal.value = true
    }

    const closePreview = () => {
      showPreviewModal.value = false
    }

    onMounted(() => {
      loadPrefilledData()
      loadCampaign()
    })

    return {
      campaign,
      loading,
      error,
      submitted,
      showPreviewModal,
      showPlacementModal,
      selectedPages,
      pageRows,
      productForms,
      formData,
      magazineData,
      layoutOptions,
      reservedPages,
      totalPrice,
      submitAssets,
      handleLogoUpload,
      handleProductImageUpload,
      formatDate,
      formatNumber,
      selectPage,
      selectLayout,
      getPageData,
      getPagePrice,
      removePlacement,
      addPlacements,
      closePlacementModal,
      showModal,
      calculateTotalPrice,
      submitReservation,
      handleImageUpload,
      closeModal,
      getPage,
      getInsidePages,
      isPageSelected,
      isPageReserved,
      getReservedByBrand,
      handlePageClick,
      handleLayoutChange,
      addAdditionalProduct,
      removeAdditionalProduct,
      handleAdditionalProductImageUpload,
      showPreview,
      closePreview
    }
  }
}
</script>

<style lang="scss" scoped>
:root {
  --primary-color: #ff69b4;
  --primary-light: rgba(255, 105, 180, 0.1);
  --text-color: #333;
  --bg-color: #f9f2f4;
  --card-bg: #fff;
  --border-color: #ddd;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Header Styles */
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

/* Card Styles */
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

/* Form Styles */
.form-group {
  margin-bottom: 25px;
  width: 100%;
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

/* File Upload Styles */
.file-upload {
  border: 2px dashed #ddd;
  border-radius: 5px;
  padding: 20px;
  text-align: center;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.file-upload:hover {
  border-color: var(--primary-color);
}

.file-upload input {
  display: none;
}

.file-upload label {
  cursor: pointer;
  display: block;
  margin: 0;
}

.file-upload-icon {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #888;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: #f5f5f5;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.file-preview {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.logo-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-size {
  color: #666;
  font-size: 0.875rem;
}

.remove-file {
  background: none;
  border: none;
  color: #666;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.remove-file:hover {
  background-color: #e0e0e0;
  color: #333;
}

.upload-success {
  color: #4caf50;
  font-size: 0.875rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background-color: #e8f5e9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upload-error {
  color: #f44336;
  font-size: 0.875rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background-color: #ffebee;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.magazine-page.reserved {
  opacity: 0.7;
  cursor: not-allowed;
  background-color: #f5f5f5;
  pointer-events: auto;
}

.reserved-badge {
  background-color: #ff6b6b;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-top: 8px;
  text-align: center;
}

.page.page-reserved {
  opacity: 0.7;
  cursor: not-allowed;
  background-color: #f5f5f5;
  border: 2px solid #ff4444;
  pointer-events: auto;
}

.page.page-reserved .page-content {
  opacity: 0.7;
}

.page.page-reserved:hover {
  transform: none;
  box-shadow: none;
}

/* Button Styles */
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

.btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Loading Styles */
.loader {
  text-align: center;
  padding: 20px;
}

.spinner {
  border: 5px solid #f3f3f3;
  border-top: 5px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Message Styles */
.message {
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
}

.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Summary Section */
.summary-section {
  margin-top: 40px;
}

.pricing-notice {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  border-left: 4px solid var(--primary-color);
}

/* Magazine Layout Styles */
.magazine-layout {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.magazine-pages {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  width: 100%;
}

.page {
  position: relative;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  min-height: 600px;
  aspect-ratio: 0.7727272727;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover:not(.page-reserved) {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.page-reserved {
    background-color: #f8f8f8 !important;
    border: 2px solid #ff4444 !important;
    cursor: not-allowed !important;
    pointer-events: none;

    .page-content {
      opacity: 0.6;
      margin-top: 2rem;
    }

    .reserved-badge {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      background-color: #ff4444;
      color: white;
      padding: 8px;
      text-align: center;
      border-radius: 6px 6px 0 0;
      font-weight: 600;
      font-size: 0.9em;
      z-index: 10;
    }
  }

  &.center-spread {
    aspect-ratio: 1.545454545;
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    
    .spread-content {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: linear-gradient(135deg, #f0f4f8 0%, #d8e2ed 100%);
      border-radius: 6px;
      padding: 2rem;
    }

    .spread-indicator {
      font-size: 1.5rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-align: center;
    }

    &.page-reserved {
      .spread-content {
        opacity: 0.6;
      }
    }
  }
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.cover-content, .toc-content, .standard-page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  margin-top: 1rem;
}

/* Add all the magazine layout styles from index.html */
.page:hover:not(.unavailable) {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.page.front-cover,
.page.back-cover {
  grid-column: 1 / -1;
  max-width: 500px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.page[id="spread-7-8"] {
  grid-column: 1 / -1;
  aspect-ratio: 1.545454545;
  max-width: none;
  background: linear-gradient(135deg, #f0f4f8 0%, #d8e2ed 100%);
}

/* Modal Styles */
.modal {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.modal-content {
  position: relative;
  background-color: #fff;
  margin: 20px auto;
  padding: 30px;
  width: 90%;
  max-width: 800px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-height: 85vh;
  overflow-y: auto;
}

#placement-modal .modal-content {
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

#placement-details {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

#selected-pages-list {
  margin-bottom: 20px;
}

.close-modal {
  position: sticky;
  top: 0;
  right: 0;
  padding: 10px;
  cursor: pointer;
  background: white;
  z-index: 1001;
  float: right;
}

/* Ensure form groups don't overflow */
.form-group {
  margin-bottom: 25px;
  width: 100%;
}

/* Add some spacing between sections */
.product-form {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

/* Make sure buttons stay at the bottom */
.btn-group {
  margin-top: 20px;
  position: sticky;
  bottom: 0;
  background: white;
  padding: 15px 0;
  border-top: 1px solid #eee;
}

/* Add remaining styles */
.page.selected {
  border: 3px solid #4CAF50;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.page.unavailable {
  opacity: 0.7;
  cursor: not-allowed;
  background: #f5f5f5;
}

.page-number {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  font-size: 0.875rem;
  color: #666;
}

.page-info {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.page-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.premium-tag {
  display: inline-block;
  background: #FFD700;
  color: #000;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.page-price {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2E7D32;
}

.reserved-by {
  font-size: 0.875rem;
  color: #D32F2F;
  margin-top: 0.5rem;
}

.layout-options {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem;
  border-radius: 8px;
}

.page:hover .layout-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.layout-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.layout-option:hover {
  background: #f8f9fa;
  transform: translateX(4px);
}

.layout-option-icon {
  font-size: 1.5rem;
}

.layout-option-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.layout-option-description {
  font-size: 0.875rem;
  color: #666;
}

.cover-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.cover-logo {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.cover-issue {
  font-size: 1.25rem;
  color: #666;
}

.toc-content {
  padding: 2rem;
}

.toc-header {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.toc-lines {
  height: 60%;
  background-image: repeating-linear-gradient(#eee 0px, #eee 1px, transparent 1px, transparent 2rem);
}

.toc-product {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px dashed #ddd;
  text-align: center;
  color: #666;
}

.spread-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.spread-indicator {
  font-size: 1.5rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.selected-count {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.selected-count span {
  font-size: 1.25rem;
  font-weight: 600;
  color: #4CAF50;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .magazine-pages {
    grid-template-columns: 1fr;
  }
  
  .page[id="spread-7-8"] {
    aspect-ratio: 0.7727272727;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .magazine-layout {
    padding: 1rem;
  }
  
  .modal-content {
    margin: 1rem;
    padding: 1rem;
  }
  
  .selected-count {
    bottom: 1rem;
    right: 1rem;
  }
}

.page-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  justify-content: center;

  &.single {
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  &.pair {
    max-width: 1000px;
    margin-left: auto;
    margin-right: auto;
  }

  &.center {
    width: 100%;
    max-width: 1000px;
    margin-left: auto;
    margin-right: auto;
  }
}

.standard-page-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ddd;
  margin: 1rem;
  border-radius: 8px;
}

.upload-label {
  display: block;
  cursor: pointer;
  padding: 20px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
}

.upload-label:hover {
  border-color: var(--primary-color);
  background-color: var(--primary-light);
}

.file-upload-icon {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #666;
}

.file-list {
  margin-top: 10px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 5px;
}

.remove-file {
  cursor: pointer;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
  background: #ddd;
}

.remove-file:hover {
  background: #ccc;
  color: #333;
}

.magazine-page.reserved {
  background-color: #f0f0f0;
  cursor: not-allowed;
  opacity: 0.7;
}

.reserved-badge {
  background-color: #ff4444;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  margin-top: 8px;
  font-weight: 500;
}

.preview-section {
  margin: 20px 0;
  text-align: center;
  padding: 20px;
  background: var(--bg-color);
  border-radius: 8px;
}

.preview-button {
  background-color: var(--primary-color);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  margin: 20px 0;

  &:hover {
    background-color: var(--primary-hover);
  }
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  width: 90%;
  height: 90%;
  background: white;
  border-radius: 12px;
  padding: 24px;
  overflow: hidden;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  z-index: 1001;
  padding: 0;
  line-height: 1;

  &:hover {
    color: #000;
  }
}
</style> 