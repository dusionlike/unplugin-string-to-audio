<script setup lang="ts">
import { onMounted, ref } from 'vue'

const au = str2au('测试一下')
const aul = typeof au === 'string' ? [au] : au
console.warn(au)
const zz = ref('$$')

onMounted(() => {
  console.warn(zz.value)
})
</script>

<template>
  <div>
    <audio v-for="item in aul" :key="item" :src="item" controls />
    <span>{{ zz }}</span>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
