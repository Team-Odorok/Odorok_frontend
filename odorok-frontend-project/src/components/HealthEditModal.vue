<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>건강정보 수정</h3>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <!-- 성별 -->
        <div class="form-group">
          <label>성별</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" v-model="formData.data.gender" :value="true" />
              <span>남성</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="formData.data.gender" :value="false" />
              <span>여성</span>
            </label>
          </div>
        </div>

        <!-- 나이 -->
        <div class="form-group">
          <label for="age">나이</label>
          <input
            type="number"
            id="age"
            v-model.number="formData.data.age"
            placeholder="나이를 입력하세요"
            min="1"
            max="120"
            required
            :class="{ 'error': validationErrors.age }"
          />
          <div v-if="validationErrors.age" class="error-message">{{ validationErrors.age }}</div>
        </div>

        <!-- 키 -->
        <div class="form-group">
          <label for="height">키 (cm)</label>
          <input
            type="number"
            id="height"
            v-model.number="formData.data.height"
            placeholder="키를 입력하세요"
            min="100"
            max="250"
            required
            :class="{ 'error': validationErrors.height }"
          />
          <div v-if="validationErrors.height" class="error-message">{{ validationErrors.height }}</div>
        </div>

        <!-- 몸무게 -->
        <div class="form-group">
          <label for="weight">몸무게 (kg)</label>
          <input
            type="number"
            id="weight"
            v-model.number="formData.data.weight"
            placeholder="몸무게를 입력하세요"
            min="20"
            max="200"
            required
            :class="{ 'error': validationErrors.weight }"
          />
          <div v-if="validationErrors.weight" class="error-message">{{ validationErrors.weight }}</div>
        </div>

        <!-- 흡연 -->
        <div class="form-group">
          <label>흡연</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" v-model="formData.data.smoking" :value="true" />
              <span>예</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="formData.data.smoking" :value="false" />
              <span>아니오</span>
            </label>
          </div>
        </div>

        <!-- 주당 음주 -->
        <div class="form-group">
          <label for="drinkPerWeek">주당 음주 횟수</label>
          <input
            type="number"
            id="drinkPerWeek"
            v-model.number="formData.data.drinkPerWeek"
            placeholder="주당 음주 횟수를 입력하세요"
            min="0"
            max="7"
            required
            :class="{ 'error': validationErrors.drinkPerWeek }"
          />
          <div v-if="validationErrors.drinkPerWeek" class="error-message">{{ validationErrors.drinkPerWeek }}</div>
        </div>

        <!-- 주당 운동 -->
        <div class="form-group">
          <label for="exercisePerWeek">주당 운동 횟수</label>
          <input
            type="number"
            id="exercisePerWeek"
            v-model.number="formData.data.exercisePerWeek"
            placeholder="주당 운동 횟수를 입력하세요"
            min="0"
            max="7"
            required
            :class="{ 'error': validationErrors.exercisePerWeek }"
          />
          <div v-if="validationErrors.exercisePerWeek" class="error-message">{{ validationErrors.exercisePerWeek }}</div>
        </div>

        <!-- 질병 목록 -->
        <div class="form-group">
          <label>질병 목록</label>
          <div class="checkbox-group">
            <label 
              v-for="(disease, id) in diseaseOptions" 
              :key="id" 
              class="checkbox-item"
            >
              <input 
                type="checkbox" 
                :value="parseInt(id)" 
                v-model="formData.data.diseaseList"
              />
              <span>{{ disease }}</span>
            </label>
          </div>
        </div>

        <!-- 버튼 영역 -->
        <div class="modal-footer">
          <button type="button" @click="closeModal" class="cancel-btn">취소</button>
          <button type="submit" :disabled="loading" class="save-btn">
            {{ loading ? '저장 중...' : '저장' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { handleApiError } from '../utils/errorHandler.js'

export default {
  name: 'HealthEditModal',
  props: {
    healthData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const loading = ref(false)
    const validationErrors = ref({})

    // 질병 옵션
    const diseaseOptions = {
      1: '고혈압',
      2: '당뇨',
      3: '비만',
      4: '허리디스크',
      5: '관절염',
      6: '고지혈증'
    }

    // 유효성 검사 함수
    const validateForm = () => {
      const errors = {}
      
      // 나이 검사
      if (!formData.data.age || formData.data.age < 1 || formData.data.age > 120) {
        errors.age = '나이는 1세 이상 120세 이하여야 합니다.'
      }
      
      // 키 검사
      if (!formData.data.height || formData.data.height < 100 || formData.data.height > 250) {
        errors.height = '키는 100cm 이상 250cm 이하여야 합니다.'
      }
      
      // 몸무게 검사
      if (!formData.data.weight || formData.data.weight < 20 || formData.data.weight > 200) {
        errors.weight = '몸무게는 20kg 이상 200kg 이하여야 합니다.'
      }
      
      // 주당 음주 횟수 검사
      if (formData.data.drinkPerWeek < 0 || formData.data.drinkPerWeek > 7) {
        errors.drinkPerWeek = '주당 음주 횟수는 0회 이상 7회 이하여야 합니다.'
      }
      
      // 주당 운동 횟수 검사
      if (formData.data.exercisePerWeek < 0 || formData.data.exercisePerWeek > 7) {
        errors.exercisePerWeek = '주당 운동 횟수는 0회 이상 7회 이하여야 합니다.'
      }
      
      validationErrors.value = errors
      return Object.keys(errors).length === 0
    }

    // 폼 데이터
    const formData = reactive({
      data: {
        gender: true,
        age: 0,
        height: 0,
        weight: 0,
        smoking: false,
        drinkPerWeek: 0,
        exercisePerWeek: 0,
        diseaseList: []
      }
    })

    // props 데이터로 폼 초기화
    if (props.healthData) {
      formData.data.gender = props.healthData.gender ?? true
      formData.data.age = props.healthData.age ?? 0
      formData.data.height = props.healthData.height ?? 0
      formData.data.weight = props.healthData.weight ?? 0
      formData.data.smoking = props.healthData.smoking ?? false
      formData.data.drinkPerWeek = props.healthData.drinkPerWeek ?? 0
      formData.data.exercisePerWeek = props.healthData.exercisePerWeek ?? 0
      formData.data.diseaseList = [...(props.healthData.diseaseList || [])]
    }

    // 모달 닫기
    const closeModal = () => {
      emit('close')
    }

    // 폼 제출
    const handleSubmit = async () => {
      // 유효성 검사
      if (!validateForm()) {
        handleApiError({ message: '입력 정보를 확인해주세요.' }, '건강정보 수정')
        return
      }
      
      loading.value = true
      try {
        await emit('save', formData)
      } catch (error) {
        handleApiError(error, '건강정보 저장')
      } finally {
        loading.value = false
      }
    }

    return {
      loading,
      validationErrors,
      diseaseOptions,
      formData,
      closeModal,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #ecf0f1;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 25px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
}

.form-group input[type="number"] {
  width: 100%;
  padding: 12px;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input[type="number"]:focus {
  outline: none;
  border-color: #3498db;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-item input[type="radio"] {
  margin: 0;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.checkbox-item:hover {
  background-color: #f8f9fa;
}

.checkbox-item input[type="checkbox"] {
  margin: 0;
}

.modal-footer {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.cancel-btn:hover {
  background: #7f8c8d;
}

.save-btn {
  background: #27ae60;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.save-btn:hover:not(:disabled) {
  background: #229954;
}

.save-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* 에러 스타일 */
.error {
  border-color: #e74c3c !important;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2) !important;
}

.error-message {
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 5px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header,
  .modal-body {
    padding: 20px;
  }
  
  .radio-group {
    flex-direction: column;
    gap: 10px;
  }
  
  .checkbox-group {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .cancel-btn,
  .save-btn {
    width: 100%;
  }
}
</style>
