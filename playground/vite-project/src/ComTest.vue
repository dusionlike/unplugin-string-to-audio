<script lang="ts" setup>
const au = str2au('组件测试一下')
const aul = typeof au === 'string' ? [au] : au
console.warn(au)
</script>

<template>
  <div class="com-test">
    <audio v-for="item in aul" :key="item" :src="item" controls />
  </div>
</template>
