<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'
import AttendanceModel from './components/AttendanceModel.vue'

const showAttendance = ref(false)


</script>

<template>
  <RouterView />
  <button
    style="position: fixed; right: 20px; bottom: 20px; z-index: 1100;"
    @click="showAttendance = true"
  >
  출석 모달 열기


</button>

  <AttendanceModel
    :visible="showAttendance"
    @close="showAttendance = false"
  />

</template>

<style scoped>

</style>