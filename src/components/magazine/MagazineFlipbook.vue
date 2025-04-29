<template>
  <div class="magazine-container">
    <div class="magazine-wrapper">
      <button class="nav-button prev" @click="prevPage" :disabled="currentPage === 1">
        ←
      </button>
      
      <div class="magazine" ref="magazineRef">
        <div v-for="(page, index) in pages" :key="index" class="page" :class="[index === 0 || index === pages.length - 1 ? 'hard' : '']">
          <div class="page-content">
            <img :src="page.image" :alt="page.name" @load="handleImageLoad" />
            <div class="page-name">{{ page.name }}</div>
          </div>
        </div>
      </div>

      <button class="nav-button next" @click="nextPage" :disabled="currentPage === pages.length">
        →
      </button>
    </div>

    <div class="page-indicator">
      Page {{ currentPage }} of {{ pages.length }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import page1 from '../../assets/magazine/page-1.png';
import page2 from '../../assets/magazine/page-2.png';
import page3 from '../../assets/magazine/page-3.png';
import page4 from '../../assets/magazine/page-4.png';
import page5 from '../../assets/magazine/page-5.png';
import page6 from '../../assets/magazine/page-6.png';
import page7 from '../../assets/magazine/page-7.png';
import page8 from '../../assets/magazine/page-8.png';
import page9 from '../../assets/magazine/page-9.png';
import page10 from '../../assets/magazine/page-10.png';
import page11 from '../../assets/magazine/page-11.png';
import page12 from '../../assets/magazine/page-12.png';
import page13 from '../../assets/magazine/page-13.png';
import page14 from '../../assets/magazine/page-14.png';
import page15 from '../../assets/magazine/page-15.png';
import page16 from '../../assets/magazine/page-16.png';

const magazineRef = ref(null);
const loadedImages = ref(0);
const currentPage = ref(1);
let flipbook = null;

const pages = [
  { name: 'Front Cover', image: page1 },
  { name: 'Front Inside Cover', image: page2 },
  { name: 'Table of Contents', image: page3 },
  { name: 'Page 4', image: page4 },
  { name: 'Page 5', image: page5 },
  { name: 'Page 6', image: page6 },
  { name: 'Page 7', image: page7 },
  { name: 'Center Spread', image: page8 },
  { name: 'Center Spread', image: page9 },
  { name: 'Page 10', image: page10 },
  { name: 'Page 11', image: page11 },
  { name: 'Page 12', image: page12 },
  { name: 'Page 13', image: page13 },
  { name: 'Page 14', image: page14 },
  { name: 'Back Inside Cover', image: page15 },
  { name: 'Back Cover', image: page16 }
];

const handleImageLoad = () => {
  loadedImages.value++;
  if (loadedImages.value === pages.length) {
    initializeFlipbook();
  }
};

const nextPage = () => {
  if (flipbook && currentPage.value < pages.length) {
    flipbook.turn('next');
    currentPage.value = Math.min(currentPage.value + 2, pages.length);
  }
};

const prevPage = () => {
  if (flipbook && currentPage.value > 1) {
    flipbook.turn('previous');
    currentPage.value = Math.max(currentPage.value - 2, 1);
  }
};

const handleKeyDown = (e) => {
  if (e.key === 'ArrowRight') {
    nextPage();
  } else if (e.key === 'ArrowLeft') {
    prevPage();
  }
};

const handleResize = () => {
  if (flipbook) {
    const newWidth = Math.min(window.innerWidth * 0.6, 1000);
    const newHeight = newWidth / aspectRatio;
    flipbook.turn('size', newWidth, newHeight);
  }
};

const initializeFlipbook = () => {
  if (!window.jQuery || !window.jQuery().turn) {
    console.error('jQuery or turn.js not loaded yet');
    return;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Calculate dimensions while maintaining aspect ratio
  const aspectRatio = 1.4; // Standard magazine aspect ratio
  let width = Math.min(viewportWidth * 0.6, 1000);
  let height = width / aspectRatio;

  // Adjust if height is too tall
  if (height > viewportHeight * 0.8) {
    height = viewportHeight * 0.8;
    width = height * aspectRatio;
  }

  try {
    flipbook = window.jQuery(magazineRef.value).turn({
      width: width,
      height: height,
      autoCenter: true,
      display: 'double',
      acceleration: false,
      gradients: !window.chrome,
      elevation: 50,
      pages: pages.length,
      when: {
        turning: function(e, page) {
          currentPage.value = page;
        },
        turned: function(e, page) {
          console.log('Page turned:', page);
          currentPage.value = page;
        }
      }
    });

    // Add keyboard navigation
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    
  } catch (error) {
    console.error('Error initializing flipbook:', error);
  }
};

onMounted(async () => {
  try {
    // Load jQuery first
    if (!window.jQuery) {
      const jqueryScript = document.createElement('script');
      jqueryScript.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
      jqueryScript.async = false;
      
      await new Promise((resolve, reject) => {
        jqueryScript.onload = resolve;
        jqueryScript.onerror = reject;
        document.head.appendChild(jqueryScript);
      });
    }

    // Then load turn.js
    if (!window.jQuery().turn) {
      const turnScript = document.createElement('script');
      turnScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js';
      turnScript.async = false;
      
      await new Promise((resolve, reject) => {
        turnScript.onload = resolve;
        turnScript.onerror = reject;
        document.head.appendChild(turnScript);
      });
    }

    // Initialize if all images are already loaded
    if (loadedImages.value === pages.length) {
      initializeFlipbook();
    }
  } catch (error) {
    console.error('Error loading dependencies:', error);
  }
});

onBeforeUnmount(() => {
  try {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', handleResize);
    
    if (flipbook) {
      // Properly remove turn.js instance
      flipbook.turn('disable', true);
      flipbook.turn('destroy');
      window.jQuery(magazineRef.value).remove();
    }
  } catch (error) {
    console.error('Error cleaning up flipbook:', error);
  }
});
</script>

<style scoped>
.magazine-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #f5f5f5;
}

.magazine-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.magazine {
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.nav-button {
  background: #ff69b4;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.nav-button:hover:not(:disabled) {
  background: #ff45a1;
  transform: scale(1.1);
}

.nav-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.page {
  background-color: white;
}

.page-content {
  position: relative;
  width: 100%;
  height: 100%;
  background: white;
}

.page-content img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.page-name {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
  padding: 5px;
  font-weight: bold;
  color: #333;
  z-index: 1;
}

.page-indicator {
  margin-top: 20px;
  font-size: 16px;
  color: #666;
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Turn.js specific styles */
.hard {
  background: #fff !important;
  box-shadow: inset 0 0 5px #666;
}

.turn-page {
  background-color: white !important;
}

.turn-page-wrapper {
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

/* Hide overflow to prevent page bleed */
.turn-page-wrapper > div {
  overflow: hidden;
}
</style> 