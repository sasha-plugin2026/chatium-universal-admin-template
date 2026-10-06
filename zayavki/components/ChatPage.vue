<template>
  <main class="page">
    <SalonBrand :salon-name="salonName" :logo-hash="logoHash" />

    <h1 class="page__title">Оставить заявку</h1>
    <p class="page__subtitle">
      Напишите помощнику: он задаст пару вопросов и передаст заявку менеджеру.
    </p>

    <div class="card">
      <div class="chat__head">
        <h1>Онлайн-помощник</h1>
        <p>Отвечает сразу, круглосуточно</p>
      </div>
      <ChatWidget :agent-id="agentId" :agent-token="agentToken" />
    </div>

    <p v-if="isStaff" class="page__nav">
      <a :href="leadsUrl">Посмотреть все заявки →</a>
    </p>
  </main>
</template>

<script setup lang="ts">
import ChatWidget from './ChatWidget.vue'
import SalonBrand from './SalonBrand.vue'

defineProps<{
  agentId: string
  agentToken: string
  isStaff: boolean
  salonName: string
  logoHash: string
  leadsUrl: string
}>()
</script>
