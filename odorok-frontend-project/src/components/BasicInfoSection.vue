<template>
  <div class="basic-info-section">
    <div class="profile-card">
      <!-- 프로필 사진 컴포넌트 -->
      <div class="profile-picture">
        <img 
          :src="profileData?.data?.userProfilePictureUrl || '/default-profile.png'" 
          :alt="profileData?.data?.userName || '프로필 이미지'"
          @error="$emit('image-error', $event)"
        />
        <div class="image-upload-overlay" @click="triggerFileInput">
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            @change="handleImageUpload" 
            style="display: none;"
          />
          <span class="upload-icon">📷</span>
          <span class="upload-text">사진 변경</span>
        </div>
      </div>
      
      <!-- 사용자 정보 -->
      <div class="user-info">
        <!-- 유저 네임 컴포넌트 -->
        <div class="user-name">
          {{ profileData?.data?.userName || '사용자' }}
        </div>
        
        <!-- 유저 티어 컴포넌트 -->
        <div class="user-tier">
          <span class="tier-level">Lv.{{ profileData?.data?.tierLevel || 0 }}</span>
          <span class="tier-name">{{ profileData?.data?.userTier || '브론즈' }}</span>
        </div>
        
        <!-- 유저 활동점수 컴포넌트 -->
        <div class="user-activity-score">
          활동점수: {{ profileData?.data?.userActivityScore || 0 }}점
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { mypageService } from '../services/mypageService.js'
import { handleApiError } from '../utils/errorHandler.js'

export default {
  name: 'BasicInfoSection',
  props: {
    profileData: {
      type: Object,
      default: () => null
    }
  },
  emits: ['image-error', 'profile-updated'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const uploading = ref(false)

    // 파일 입력 트리거
    const triggerFileInput = () => {
      fileInput.value?.click()
    }

    // 이미지 업로드 처리
    const handleImageUpload = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      // 파일 크기 검사 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        handleApiError({ message: '파일 크기는 5MB 이하여야 합니다.' }, '이미지 업로드')
        return
      }

      // 파일 타입 검사
      if (!file.type.startsWith('image/')) {
        handleApiError({ message: '이미지 파일만 업로드 가능합니다.' }, '이미지 업로드')
        return
      }

      uploading.value = true
      try {
        await mypageService.uploadProfileImage(file)
        emit('profile-updated')
      } catch (error) {
        handleApiError(error, '프로필 이미지 업로드')
      } finally {
        uploading.value = false
        // 파일 입력 초기화
        if (fileInput.value) {
          fileInput.value.value = ''
        }
      }
    }

    return {
      fileInput,
      uploading,
      triggerFileInput,
      handleImageUpload
    }
  }
}
</script>

<style scoped>
.basic-info-section {
  margin-bottom: 30px;
}

.profile-card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 30px;
}

.profile-picture {
  flex-shrink: 0;
  position: relative;
}

.profile-picture img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #303E69;
}

.image-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
  font-size: 0.8rem;
}

.profile-picture:hover .image-upload-overlay {
  opacity: 1;
}

.upload-icon {
  font-size: 1.2rem;
  margin-bottom: 2px;
}

.upload-text {
  font-weight: 500;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
}

.user-tier {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.tier-level {
  background: #303E69;
  color: white;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 1rem;
  font-weight: bold;
}

.tier-name {
  color: #7f8c8d;
  font-size: 1.1rem;
  font-weight: 500;
}

.user-activity-score {
  color: #384F45;
  font-size: 1.1rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .profile-card {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .user-name {
    font-size: 1.5rem;
  }
  
  .user-tier {
    justify-content: center;
  }
}
</style>
