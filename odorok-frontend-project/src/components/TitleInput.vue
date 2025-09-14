<template>
  <div class="title-input">
    <label for="title">제목</label>
    <input 
      id="title" 
      v-model="title" 
      type="text" 
      placeholder="제목을 입력하세요" 
      @input="handleInput"
      required 
    />
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'TitleInput',
  emits: ['title-changed'],
  setup(props, { emit }) {
    const title = ref('')
    
    const handleInput = () => {
      emit('title-changed', title.value)
    }
    
    return {
      title,
      handleInput
    }
  }
}
</script>

<style scoped>
.title-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-input label {
  font-weight: 600;
  color: #333;
}

.title-input input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.title-input input:focus {
  outline: none;
  border-color: #3498db;
}
</style> 