<template>
  <div class="pagination" v-if="totalPages > 1">
    <button 
      @click="handlePageChange(currentPage - 1)"
      :disabled="currentPage === 1"
      class="page-button"
    >
      이전
    </button>
    
    <div class="page-numbers">
      <button 
        v-for="page in visiblePages" 
        :key="page"
        @click="handlePageChange(page)"
        :class="{ active: page === currentPage }"
        class="page-number"
      >
        {{ page }}
      </button>
    </div>
    
    <button 
      @click="handlePageChange(currentPage + 1)"
      :disabled="currentPage === totalPages"
      class="page-button"
    >
      다음
    </button>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'Pagination',
  props: {
    currentPage: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    }
  },
  emits: ['page-changed'],
  setup(props, { emit }) {
    const visiblePages = computed(() => {
      const pages = []
      const start = Math.max(1, props.currentPage - 2)
      const end = Math.min(props.totalPages, props.currentPage + 2)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      return pages
    })
    
    const handlePageChange = (page) => {
      if (page >= 1 && page <= props.totalPages) {
        emit('page-changed', page)
      }
    }
    
    return {
      visiblePages,
      handlePageChange
    }
  }
}
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 20px 0;
}

.page-button {
  padding: 8px 16px;
  border: 1px solid #e1e8ed;
  background: white;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #303E69;
  color: #303E69;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  padding: 8px 12px;
  border: 1px solid #e1e8ed;
  background: white;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;
}

.page-number:hover {
  background: #f8f9fa;
  border-color: #303E69;
  color: #303E69;
}

.page-number.active {
  background: #303E69;
  border-color: #303E69;
  color: white;
}
</style>