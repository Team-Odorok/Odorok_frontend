<template>
  <div class="image-upload">
    <label for="images">이미지 첨부</label>
    <input 
      id="images" 
      type="file" 
      @change="handleFileChange" 
      multiple 
      accept="image/*"
    />
    
    <!-- 이미지 미리보기 -->
    <div class="image-preview" v-if="selectedImages.length > 0">
      <div v-for="(image, index) in selectedImages" :key="index" class="image-item">
        <img :src="image.preview" alt="미리보기" />
        <button @click="removeImage(index)" class="remove-btn">삭제</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'ImageUpload',
  emits: ['image-changed'],
  setup(props, { emit }) {
    const selectedImages = ref([])
    
    const handleFileChange = (event) => {
      const files = Array.from(event.target.files)
      
      files.forEach(file => {
        // 파일 크기 체크 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
          alert('파일 크기는 5MB 이하여야 합니다.')
          return
        }
        
        // 이미지 파일인지 체크
        if (!file.type.startsWith('image/')) {
          alert('이미지 파일만 업로드 가능합니다.')
          return
        }
        
        // 미리보기 URL 생성
        const reader = new FileReader()
        reader.onload = (e) => {
          selectedImages.value.push({
            file: file,
            preview: e.target.result
          })
          emit('image-changed', selectedImages.value)
        }
        reader.readAsDataURL(file)
      })
    }
    
    const removeImage = (index) => {
      selectedImages.value.splice(index, 1)
      emit('image-changed', selectedImages.value)
    }
    
    return {
      selectedImages,
      handleFileChange,
      removeImage
    }
  }
}
</script>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-upload label {
  font-weight: 600;
  color: #333;
}

.image-upload input[type="file"] {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.image-item {
  position: relative;
  width: 100px;
  height: 100px;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.remove-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 12px;
}

.remove-btn:hover {
  background: #c0392b;
}
</style> 