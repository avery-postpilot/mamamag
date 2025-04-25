<template>
  <div class="app">
    <nav v-if="user">
      <router-link to="/">Home</router-link> |
      <router-link to="/campaign-manager">Campaign Manager</router-link> |
      <router-link to="/assets">Assets</router-link> |
      <router-link to="/brands">Brand Lookup</router-link>
      <button @click="handleSignOut">Sign Out</button>
    </nav>
    <router-view></router-view>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { user, init, signOut } from './stores/auth'

const router = useRouter()

onMounted(() => {
  init()
})

async function handleSignOut() {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
</script>

<style>
.app {
  font-family: 'Poppins', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

nav {
  padding: 30px;
  text-align: right;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  margin: 0 10px;
}

nav a.router-link-exact-active {
  color: #ff69b4;
}

button {
  margin-left: 10px;
  padding: 8px 16px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #ff45a1;
}
</style> 