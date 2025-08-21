<template>
  <div class="write-button-container">
    <button @click="handleWriteClick" class="write-button">
      <span class="icon">✏️</span>
      <span class="text">글쓰기</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'WriteButton',
  emits: ['write-clicked'],
  methods: {
    handleWriteClick() {
      this.$emit('write-clicked')
    }
  }
}
</script>

<style scoped>
.write-button-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.write-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  transition: all 0.2s ease;
}

.write-button:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
}

.icon {
  font-size: 1.2rem;
}

.text {
  font-weight: 600;
}
</style>