<template>
  <div v-if="logoUrl || salonName" class="brand">
    <img v-if="logoUrl" class="brand__logo" :src="logoUrl" :alt="salonName" />
    <span v-else class="brand__name">{{ salonName }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getThumbnailUrl } from '@app/storage'

const props = defineProps<{ salonName: string; logoHash: string }>()

const logoUrl = computed(() =>
  props.logoHash ? getThumbnailUrl(ctx, props.logoHash, 240) : '',
)
</script>
