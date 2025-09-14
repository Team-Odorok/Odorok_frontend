<template>
  <div class="write-actions">
    <button @click="$emit('cancel')" class="btn-secondary" :disabled="isSubmitting">
      취소
    </button>
    <button @click="$emit('submit')" class="btn-primary" :disabled="isSubmitting">
      {{ isSubmitting ? '글쓰는 중...' : '글 작성' }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'WriteActions',
  props: {
    isSubmitting: {
      type: Boolean,
      default: false
    }
  },
  emits: ['submit', 'cancel']
}
</script>

<style scoped>
.write-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-secondary:disabled {
  background: #ecf0f1;
  color: #bdc3c7;
  cursor: not-allowed;
}
</style> 