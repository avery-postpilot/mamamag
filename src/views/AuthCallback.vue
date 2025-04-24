<template>
  <div class="auth-callback">
    <div class="loading">
      <h2>Completing sign in...</h2>
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { init } from '../stores/auth'

const router = useRouter()

onMounted(async () => {
  await init()
  router.push('/campaign-manager')
})
</script>

<style scoped>
.auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f9f2f4;
}

.loading {
  text-align: center;
}

.loading h2 {
  color: #ff69b4;
  margin-bottom: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff69b4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 