<template>
  <main class="page">
    <SalonBrand :salon-name="salonName" :logo-hash="logoHash" />

    <h1 class="page__title">Заявки</h1>
    <p class="page__subtitle">Заявки, которые собрал ИИ-помощник. Статус можно менять в один клик.</p>

    <div class="card">
      <div class="toolbar">
        <span class="toolbar__count">{{ countText }}</span>
        <div class="toolbar__actions">
          <a class="button button--ghost" :href="settingsUrl">Настройки записи</a>
          <button type="button" class="button button--ghost" :disabled="loading" @click="load">
            Обновить
          </button>
        </div>
      </div>

      <p v-if="loading" class="empty" role="status">Загружаем заявки…</p>

      <div v-else-if="error" class="empty" role="alert">
        <p>{{ error }}</p>
        <button type="button" class="button" @click="load">Попробовать снова</button>
      </div>

      <p v-else-if="!leads.length" class="empty">
        Заявок пока нет. Откройте <a :href="chatUrl">чат</a> и оставьте тестовую заявку.
      </p>

      <template v-else>
        <p v-if="statusError" class="notice">{{ statusError }}</p>
        <div class="table-wrap">
          <table class="leads">
            <thead>
              <tr>
                <th>Когда</th>
                <th>Имя</th>
                <th>Телефон</th>
                <th>Услуга</th>
                <th>Желаемая дата и время</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lead in leads" :key="lead.id">
                <td class="leads__date">{{ formatDate(lead.createdAt) }}</td>
                <td>
                  {{ lead.name }}
                  <div v-if="lead.comment" class="leads__date">{{ lead.comment }}</div>
                </td>
                <td class="leads__phone">{{ lead.phone }}</td>
                <td>{{ lead.service }}</td>
                <td>
                  <template v-if="lead.visitStartText">{{ lead.visitStartText }}</template>
                  <div v-if="lead.visitAt" class="leads__date" :class="{ 'leads__none': !lead.visitStartText }">
                    {{ lead.visitAt }}
                  </div>
                  <span v-else-if="!lead.visitStartText" class="leads__none">—</span>
                </td>
                <td>
                  <div class="status-group">
                    <button
                      v-for="option in statusOptions"
                      :key="option.value"
                      type="button"
                      class="status-btn"
                      :class="[
                        `status-btn--${option.value}`,
                        { 'status-btn--active': lead.status === option.value },
                      ]"
                      :disabled="savingId === lead.id"
                      @click="setStatus(lead, option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <p class="page__nav"><a :href="chatUrl">← Открыть чат с помощником</a></p>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { leadsListRoute } from '../api/leads/list'
import { leadStatusRoute } from '../api/leads/status'
import SalonBrand from './SalonBrand.vue'

defineProps<{
  salonName: string
  logoHash: string
  chatUrl: string
  settingsUrl: string
}>()

type LeadStatus = 'new' | 'in_progress' | 'done'

type Lead = {
  id: string
  name: string
  phone: string
  service: string
  visitAt: string
  visitStartText: string
  comment: string
  status: string
  createdAt: string
}

const leads = ref<Lead[]>([])
const loading = ref(true)
const error = ref('')
const statusError = ref('')
const savingId = ref('')

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Готово' },
]

const countText = computed(() => {
  if (loading.value) return 'Загрузка…'
  const total = leads.value.length
  if (!total) return 'Пока пусто'
  return total === 1 ? '1 заявка' : `Всего заявок: ${total}`
})

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    leads.value = await leadsListRoute.run(ctx)
  } catch {
    error.value = 'Не удалось загрузить заявки. Проверьте, что вы вошли как сотрудник.'
  } finally {
    loading.value = false
  }
}

async function setStatus(lead: Lead, status: LeadStatus) {
  if (lead.status === status || savingId.value) return

  const previous = lead.status
  statusError.value = ''
  savingId.value = lead.id
  lead.status = status
  try {
    await leadStatusRoute.query({ id: lead.id }).run(ctx, { status })
  } catch {
    lead.status = previous
    statusError.value = 'Не удалось изменить статус. Попробуйте ещё раз.'
  } finally {
    savingId.value = ''
  }
}

onMounted(load)
</script>
