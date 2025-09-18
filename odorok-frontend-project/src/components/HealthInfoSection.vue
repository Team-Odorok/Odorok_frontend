<template>
  <div class="health-info-section">
    <div class="health-card">
      <div class="health-header">
        <h3>건강 정보</h3>
        <button @click="$emit('edit-health')" class="edit-btn">정보 수정</button>
      </div>
      
      <div class="health-content" v-if="healthData?.data">
        <!-- 기본 건강 정보 -->
        <div class="health-basic-info">
          <div class="health-row">
            <span class="label">성별</span>
            <span class="value">{{ healthData.data.gender ? '남성' : '여성' }}</span>
          </div>
          <div class="health-row">
            <span class="label">나이</span>
            <span class="value">{{ healthData.data.age }}세</span>
          </div>
          <div class="health-row">
            <span class="label">키</span>
            <span class="value">{{ healthData.data.height }}cm</span>
          </div>
          <div class="health-row">
            <span class="label">몸무게</span>
            <span class="value">{{ healthData.data.weight }}kg</span>
          </div>
          <div class="health-row">
            <span class="label">흡연</span>
            <span class="value">{{ healthData.data.smoking ? '예' : '아니오' }}</span>
          </div>
          <div class="health-row">
            <span class="label">주당 음주</span>
            <span class="value">{{ healthData.data.drinkPerWeek }}회</span>
          </div>
          <div class="health-row">
            <span class="label">주당 운동</span>
            <span class="value">{{ healthData.data.exercisePerWeek }}회</span>
          </div>
        </div>

        <!-- 유저 상태 (질병 목록) -->
        <div class="user-status" v-if="healthData.data.diseaseList?.length > 0">
          <h4>유저 상태</h4>
          <div class="disease-list">
            <div 
              v-for="diseaseId in healthData.data.diseaseList" 
              :key="diseaseId"
              class="disease-item"
            >
              <span class="disease-check">✓</span>
              <span class="disease-name">{{ getDiseaseName(diseaseId) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-data">
        건강 정보가 없습니다.
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HealthInfoSection',
  props: {
    healthData: {
      type: Object,
      default: () => null
    }
  },
  emits: ['edit-health'],
  setup() {
    // 질병 ID와 이름 매핑 (실제로는 API에서 가져와야 함)
    const diseaseMapping = {
      1: '고혈압',
      2: '당뇨',
      3: '허리디스크',
      4: '관절염',
      5: '고지혈증'
    }

    const getDiseaseName = (diseaseId) => {
      return diseaseMapping[diseaseId] || `질병 ${diseaseId}`
    }

    return {
      getDiseaseName
    }
  }
}
</script>

<style scoped>
.health-info-section {
  margin-bottom: 30px;
}

.health-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.health-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #ecf0f1;
}

.health-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: bold;
}

.edit-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.edit-btn:hover {
  background: #2980b9;
}

.health-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.health-basic-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.health-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f2f6;
}

.health-row:last-child {
  border-bottom: none;
}

.health-row .label {
  color: #7f8c8d;
  font-weight: 500;
  font-size: 1rem;
}

.health-row .value {
  color: #2c3e50;
  font-weight: 600;
  font-size: 1rem;
}

.user-status {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
}

.user-status h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: bold;
}

.disease-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.disease-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.disease-check {
  color: #27ae60;
  font-weight: bold;
  font-size: 1.1rem;
}

.disease-name {
  color: #2c3e50;
  font-weight: 500;
}

.no-data {
  text-align: center;
  color: #7f8c8d;
  padding: 40px;
  font-style: italic;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .health-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .health-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .edit-btn {
    width: 100%;
  }
}
</style>
