<template>
  <div class="write-container">
    <div class="write-header">
      <h1>글쓰기</h1>
      <p>여행 경험을 공유해보세요</p>
    </div>

    <div class="write-content">
      <!-- 제목 입력 컴포넌트  -->
      <TitleInput @title-changed="handleTitleChange"/>
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
      // 문서 스펙 필드(임시 기본값). 실제 값 연결 시 UI에서 설정하도록 확장 가능
      boardType: 1,
      diseaseId: null,
      courseId: null,
    })
    
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
          alert('제목을 입력해주세요')
          return
        }

        if (!formData.value.content.trim()) {
          alert('내용을 입력해주세요')
          return
        }

        const formDataToSend = new FormData()

        // 이미지가 있을 때만 추가
        if (selectedImages.value && selectedImages.value.length > 0) {
          selectedImages.value.forEach((image) => {
            formDataToSend.append('images', image.file)
          })
        }

        const jsonData = {
          title: formData.value.title,
          content: formData.value.content,
          notice: !!formData.value.notice,
        }
        // 숫자 필드가 유효하면 포함(스펙: boardType, diseaseId, courseId)
        const bt = Number(formData.value.boardType)
        if (!Number.isNaN(bt)) jsonData.boardType = bt
        const did = Number(formData.value.diseaseId)
        if (!Number.isNaN(did) && formData.value.diseaseId !== null && formData.value.diseaseId !== '') jsonData.diseaseId = did
        const cid = Number(formData.value.courseId)
        if (!Number.isNaN(cid) && formData.value.courseId !== null && formData.value.courseId !== '') jsonData.courseId = cid

        formDataToSend.append('data', new Blob([JSON.stringify(jsonData)], {
          type: 'application/json'
        }))

        const response = await communityApi.createArticle(formDataToSend)

        if (response.status === 'success') {
          alert('게시글이 성공적으로 등록되었습니다.')
          router.push('/community')
        } else {
          alert('게시글 등록에 실패했습니다.')
        }

      } catch (error) {
        console.error('게시글 등록 중 오류 발생:', error)
        alert('게시글 등록에 실패했습니다.')
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
</style> 