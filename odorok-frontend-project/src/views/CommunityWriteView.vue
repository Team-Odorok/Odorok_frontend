<template>
  <div class="write-container">
    <div class="write-header">
      <h1>글쓰기</h1>
      <p>여행 경험을 공유해보세요</p>
    </div>

    <div class="write-content">
      <!-- 제목 입력 컴포넌트  -->
      <TitleInput @title-changed="handleTitleChange"/>
      
      <!-- 질병 선택 -->
      <div class="form-section">
        <h3>질병 선택</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="diseaseId">관련 질병을 선택하세요</label>
            <select id="diseaseId" v-model="formData.diseaseId" class="form-select" required>
              <option v-for="option in diseaseOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- 이미지 업로드 컴포넌트 -->
      <ImageUpload @image-changed="handleImageChange"/>
      <!-- 내용 입력 컴포넌트 -->
      <ContentEditor @content-changed="handleContentChange"/>

      <WriteActions
        @submit="submitArticle"
        @cancel="goBack"
        :isSubmitting="isSubmitting"
      />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { communityApi } from '@/api/communityApi'
import { handleApiError, showSuccess } from '@/utils/errorHandler.js'
import TitleInput from '@/components/TitleInput.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import ContentEditor from '@/components/ContentEditor.vue'
import WriteActions from '@/components/WriteActions.vue'

export default {
  name: "CommunityWriteView",
  components: {
    TitleInput,
    ImageUpload,
    ContentEditor,
    WriteActions,
  },
  setup() {
    const router = useRouter()

    const formData = ref({
      title: '',
      content: '',
      notice: false,
      // 고정값: 질병별 추천 게시판
      boardType: 3,
      diseaseId: null,
      courseId: null,
    })
    
    // 질병 옵션
    const diseaseOptions = ref([
      { value: null, label: '질병을 선택하세요' },
      { value: 1, label: '고혈압' },
      { value: 2, label: '당뇨' },
      { value: 3, label: '허리디스크' },
      { value: 4, label: '관절염' },
      { value: 5, label: '고지혈증' }
    ])
    
    const selectedImages = ref([])
    const isSubmitting = ref(false)

    const handleTitleChange = (title) => {
      formData.value.title = title
    }

    const handleImageChange = (images) => {
      selectedImages.value = images
    }

    const handleContentChange = (content) => {
      formData.value.content = content
    }

    const submitArticle = async () => {
      try {
        isSubmitting.value = true
      
        if (!formData.value.title.trim()) {
          handleApiError({ message: '제목을 입력해주세요' }, '게시글 작성')
          return
        }

        if (!formData.value.content.trim()) {
          handleApiError({ message: '내용을 입력해주세요' }, '게시글 작성')
          return
        }

        if (!formData.value.diseaseId) {
          handleApiError({ message: '질병을 선택해주세요' }, '게시글 작성')
          return
        }

        // 스웨거 명세에 맞는 데이터 형식으로 변환
        const articleData = {
          title: formData.value.title,
          content: formData.value.content,
          boardType: 3, // 고정값: 질병별 추천
          notice: false,
          diseaseId: Number(formData.value.diseaseId),
          courseId: null,
          images: selectedImages.value.map(img => img.file)
        }

        console.log('📤 전송할 데이터:', articleData)

        const response = await communityApi.createArticle(articleData)

        if (response.status === 'success') {
          showSuccess('게시글이 성공적으로 등록되었습니다.')
          router.push('/community')
        } else {
          handleApiError({ message: '게시글 등록에 실패했습니다.' }, '게시글 작성')
        }

      } catch (error) {
        handleApiError(error, '게시글 작성')
      } finally {
        isSubmitting.value = false
      }
    }

    const goBack = () => {
      router.push('/community')
    }

    return {
      formData,
      selectedImages,
      isSubmitting,
      diseaseOptions,
      handleTitleChange,
      handleImageChange,
      handleContentChange,
      submitArticle,
      goBack,
    }
  }
}
</script>

<style scoped>
.write-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.write-header {
  text-align: center;
  margin-bottom: 40px;
}

.write-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.write-header p {
  font-size: 1.1rem;
  color: #666;
}

.write-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.form-section h3 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 1.1rem;
}

.form-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #495057;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  color: #495057;
}

.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}
</style> 