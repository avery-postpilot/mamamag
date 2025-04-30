<template>
  <div class="home">
    <header>
      <div class="logo-container">
        <router-link to="/">
          <img src="../assets/mamamag-logo.svg" alt="MamaMag Logo" class="logo">
        </router-link>
      </div>
      <h1>Welcome to MamaMag Campaign Portal</h1>
    </header>

    <div class="content">
      <div class="card">
        <h2>Campaign Manager</h2>
        <p>Create and manage your advertising campaigns</p>
        <router-link to="/campaign-manager" class="btn primary">
          Go to Campaign Manager
        </router-link>
      </div>

      <div class="card">
        <h2>Asset Dashboard</h2>
        <p>View and manage campaign assets and submissions</p>
        <router-link to="/assets" class="btn secondary">
          Go to Asset Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView'
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

header {
  text-align: center;
  margin-bottom: 60px;
}

.logo {
  max-width: 200px;
  margin-bottom: 20px;
}

h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 20px;
}

.content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  justify-content: center;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h2 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 15px;
}

p {
  color: #666;
  margin-bottom: 25px;
  line-height: 1.5;
}

.btn {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn.primary {
  background: #007bff;
  color: white;
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn:hover {
  opacity: 0.9;
}
</style> 