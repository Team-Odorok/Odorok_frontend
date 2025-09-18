<template>
  <div class="mypage-container">
    <div class="mypage-header">
      <h1>마이페이지</h1>
    </div>
    
    <div class="mypage-content">
      <p>마이페이지 내용이 여기에 표시됩니다.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MyPageView',
  setup() {
    return {
      // 마이페이지 관련 데이터와 함수들
    }
  }
}
</script>

<style scoped>
.mypage-container {
  min-height: 100vh;
  width: 100%;
  background: #f8f9fa;
  padding: 20px;
}

.mypage-header {
  text-align: center;
  margin-bottom: 40px;
}

.mypage-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin: 0;
}

.mypage-content {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.mypage-content p {
  font-size: 1.1rem;
  color: #666;
  text-align: center;
  margin: 0;
}
</style>
