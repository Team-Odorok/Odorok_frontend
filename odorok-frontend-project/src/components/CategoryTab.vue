<template>
  <div class="category-tab">
    <div class="category-buttons">
      <button 
        v-for="category in categories" 
        :key="category.value"
        @click="selectCategory(category.value)"
        :class="{ active: selectedCategory === category.value }"
        class="category-button"
      >
        {{ category.label }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'CategoryTab',
  emits: ['category-changed'],
  setup(props, { emit }) {
    const selectedCategory = ref('all')
    
    const categories = [
      { value: 'all', label: '전체' },
      { value: 'travel', label: '여행' },
      { value: 'food', label: '맛집' },
      { value: 'culture', label: '문화' },
      { value: 'shopping', label: '쇼핑' }
    ]
    
    const selectCategory = (category) => {
      selectedCategory.value = category
      emit('category-changed', category)
    }
    
    return {
      selectedCategory,
      categories,
      selectCategory
    }
  }
}
</script>

<style scoped>
.category-tab {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.category-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.category-button {
  padding: 8px 16px;
  border: 1px solid #e1e8ed;
  background: white;
  color: #666;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.category-button:hover {
  background: #f8f9fa;
  border-color: #3498db;
  color: #3498db;
}

.category-button.active {
  background: #3498db;
  border-color: #3498db;
  color: white;
}
</style>