<template>
  <div v-if="isVisible" class="regenerate-form">
    <div class="form-header">
      <h4>일지 재생성</h4>
      <button @click="closeForm" class="close-btn">×</button>
    </div>
    
    <div class="form-body">
      <div class="feedback-section">
        <label for="feedback-input">재생성 피드백 (선택사항)</label>
        <textarea
          id="feedback-input"
          v-model="feedback"
          placeholder="어떤 부분을 개선하고 싶으신가요? (선택사항)"
          class="feedback-input"
          rows="5"
        ></textarea>
      </div>
    </div>
    
    <div class="form-footer">
      <button @click="closeForm" class="cancel-btn">취소</button>
      <button @click="confirmRegenerate" class="confirm-btn" :disabled="isRegenerating">
        <span v-if="!isRegenerating">재생성 시작</span>
        <span v-else>재생성 중...</span>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'RegenerateForm',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    isRegenerating: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'confirm'],
  setup(props, { emit }) {
    const feedback = ref('')
    
    // 폼이 닫힐 때 피드백 초기화
    watch(() => props.isVisible, (newValue) => {
      if (!newValue) {
        feedback.value = ''
      }
    })
    
    const closeForm = () => {
      emit('close')
    }
    
    const confirmRegenerate = () => {
      emit('confirm', feedback.value)
    }
    
    return {
      feedback,
      closeForm,
      confirmRegenerate
    }
  }
}
</script>

<style scoped>
.regenerate-form {
  padding: 20px 30px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  border-radius: 0 0 12px 12px;
  margin-top: 20px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.form-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.form-body {
  margin-bottom: 20px;
}

.feedback-section {
  margin-bottom: 0;
}

.feedback-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 1rem;
}

.feedback-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.feedback-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.feedback-input::placeholder {
  color: #9ca3af;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  padding: 10px 20px;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.cancel-btn:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
}

.confirm-btn {
  padding: 10px 20px;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  min-width: 120px;
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.confirm-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 반응형 디자인 */
@media (max-width: 640px) {
  .regenerate-form {
    padding: 15px 20px;
  }
  
  .form-header {
    margin-bottom: 15px;
    padding-bottom: 10px;
  }
  
  .form-footer {
    flex-direction: column;
    gap: 10px;
  }
  
  .cancel-btn,
  .confirm-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
