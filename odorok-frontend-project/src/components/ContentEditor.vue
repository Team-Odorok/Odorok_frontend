<template>
  <div class="content-editor">
    <label for="content">내용</label>
    <textarea 
      id="content" 
      v-model="content" 
      placeholder="내용을 입력하세요" 
      rows="10" 
      @input="handleInput"
      required 
    ></textarea>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'ContentEditor',
  emits: ['content-changed'],
  setup(props, { emit }) {
    const content = ref('')
    
    const handleInput = () => {
      emit('content-changed', content.value)
    }
    
    return {
      content,
      handleInput
    }
  }
}
</script>

<style scoped>
.content-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content-editor label {
  font-weight: 600;
  color: #333;
}

.content-editor textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  min-height: 200px;
  font-family: inherit;
}

.content-editor textarea:focus {
  outline: none;
  border-color: #3498db;
}
</style> 