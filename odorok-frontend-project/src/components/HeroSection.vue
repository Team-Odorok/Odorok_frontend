<template>
  <header class="hero-section">
    <div class="hero-content">
      <h1 class="hero-title">오도록</h1>
      <p class="hero-subtitle">당신의 여행 이야기를 기록하고 공유하세요</p>
      <div class="hero-buttons">
        <router-link to="/diaries" class="btn btn-primary">
          일지 보기
        </router-link>
        <router-link to="/diaries/create/style" class="btn btn-secondary">
          일지 작성
        </router-link>
      </div>
    </div>
    <div class="hero-image">
      <div class="hero-placeholder">
        🗺️
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'HeroSection'
}
</script>

<style scoped>
/* 헤더 섹션 */
.hero-section {
  display: flex;
  align-items: center;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  color: white;
  width: 100%;
  box-sizing: border-box;
}

.hero-content {
  flex: 1;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-family: 'NanumMyeongjo', serif;
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.hero-subtitle {
  font-family: 'NanumMyeongjo', serif;
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-block;
  border: 2px solid transparent;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: transparent;
  color: white;
  border-color: white;
}

.btn-secondary:hover {
  background: white;
  color: #333;
  transform: translateY(-2px);
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.hero-placeholder {
  font-size: 8rem;
  opacity: 0.8;
  text-align: center;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .hero-image {
    padding: 1rem;
  }
  
  .hero-placeholder {
    font-size: 4rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .btn {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
}
</style>
