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

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'
import AttendanceModel from './components/AttendanceModel.vue'
const showAttendance = ref(false)
import DiaryListView from './views/DiaryListView.vue'
</script>


<style scoped>

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

</style>
