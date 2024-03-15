<script setup lang="ts">
const au = str2au('测试一下')
const au3 = str2au('测试: 一"下"3')
const aul = typeof au === 'string' ? [au] : au
console.warn(au3)
console.warn(au)
</script>

<template>
  <div>
    <audio v-for="item in aul" :key="item" :src="item" controls />
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
