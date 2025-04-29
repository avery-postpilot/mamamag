<template>
  <div class="magazine-preview">
    <button class="preview-button" @click="openPreview">
      Preview MamaMag
    </button>

    <div v-if="showModal" class="modal-overlay" @click.self="closePreview">
      <div class="modal-content">
        <div class="modal-header">
          <h2>MamaMag Preview</h2>
          <button class="close-button" @click="closePreview">×</button>
        </div>
        
        <div class="disclaimer">
          <p>This is an example preview only. The brands shown in this mockup are not guaranteed to be in an upcoming mailer.</p>
        </div>

        <div class="flipbook-container">
          <div class="page-navigation">
            <button @click="prevPage" :disabled="currentPage === 1" class="nav-button">
              <span class="arrow">←</span> Previous
            </button>
            <div class="page-info">
              <div class="page-title">{{ getPageTitle(currentPage) }}</div>
              <div class="page-number">Page {{ currentPage }} of {{ totalPages }}</div>
            </div>
            <button @click="nextPage" :disabled="currentPage === totalPages" class="nav-button">
              Next <span class="arrow">→</span>
            </button>
          </div>
          
          <div class="book-wrapper" :class="{ 'flipping': isFlipping }">
            <div class="page current-page" :style="currentPageStyle">
              <embed 
                :src="getCurrentPageUrl()" 
                type="application/pdf"
                class="pdf-embed"
              />
            </div>
            <div class="page next-page" :style="nextPageStyle">
              <embed 
                :src="getNextPageUrl()" 
                type="application/pdf"
                class="pdf-embed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const showModal = ref(false)
const currentPage = ref(1)
const totalPages = ref(16)
const isFlipping = ref(false)

const getCurrentPageUrl = () => `/src/assets/magazine/page-${currentPage.value}.pdf`
const getNextPageUrl = () => `/src/assets/magazine/page-${Math.min(currentPage.value + 1, totalPages.value)}.pdf`

const getPageTitle = (pageNumber) => {
  if (pageNumber === 1) return 'Front Cover'
  if (pageNumber === 2) return 'Front Inside Cover'
  if (pageNumber === 3) return 'Table of Contents'
  if (pageNumber === Math.ceil(totalPages.value / 2)) return 'Center Spread (Left)'
  if (pageNumber === Math.ceil(totalPages.value / 2) + 1) return 'Center Spread (Right)'
  if (pageNumber === totalPages.value - 1) return 'Back Inside Cover'
  if (pageNumber === totalPages.value) return 'Back Cover'
  return 'Standard Page'
}

const prevPage = async () => {
  if (currentPage.value > 1) {
    isFlipping.value = true
    await new Promise(resolve => setTimeout(resolve, 500))
    currentPage.value--
    setTimeout(() => {
      isFlipping.value = false
    }, 50)
  }
}

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    isFlipping.value = true
    await new Promise(resolve => setTimeout(resolve, 500))
    currentPage.value++
    setTimeout(() => {
      isFlipping.value = false
    }, 50)
  }
}

const openPreview = () => {
  showModal.value = true
  currentPage.value = 1
}

const closePreview = () => {
  showModal.value = false
  currentPage.value = 1
}

const currentPageStyle = computed(() => ({
  transform: isFlipping.value ? 'rotateY(-180deg)' : 'rotateY(0deg)'
}))

const nextPageStyle = computed(() => ({
  transform: isFlipping.value ? 'rotateY(0deg)' : 'rotateY(180deg)'
}))
</script>

<style scoped>
.magazine-preview {
  margin: 20px 0;
}

.preview-button {
  background-color: #ff69b4;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.preview-button:hover {
  background-color: #ff45a1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 95%;
  max-height: 95vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  color: #333;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
}

.disclaimer {
  background-color: #fff3cd;
  color: #856404;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 24px;
  font-size: 0.9rem;
}

.flipbook-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.page-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 20px;
}

.nav-button {
  background-color: #ff69b4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.nav-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.nav-button:not(:disabled):hover {
  background-color: #ff45a1;
  transform: translateY(-2px);
}

.arrow {
  font-size: 1.2em;
}

.page-info {
  text-align: center;
}

.page-title {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 4px;
}

.page-number {
  font-size: 0.9rem;
  color: #666;
}

.book-wrapper {
  position: relative;
  width: 100%;
  height: 70vh;
  perspective: 2000px;
}

.page {
  position: absolute;
  width: 100%;
  height: 100%;
  transform-origin: left center;
  transition: transform 0.5s ease;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pdf-embed {
  width: 100%;
  height: 100%;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Add smooth transition for page flipping */
.current-page, .next-page {
  transition: transform 0.5s ease;
}

.current-page {
  z-index: 2;
}

.next-page {
  z-index: 1;
}

@media (max-width: 768px) {
  .modal-content {
    padding: 16px;
  }

  .page-navigation {
    flex-direction: column;
    gap: 12px;
  }

  .nav-button {
    width: 100%;
    justify-content: center;
  }
}
</style> 