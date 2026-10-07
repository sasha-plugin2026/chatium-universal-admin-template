<template>
  <main class="page">
    <h1 class="page__title">Настройки записи</h1>
    <p class="page__subtitle">
      По этим часам помощник проверяет свободные окна, а цены берёт только из прайса ниже.
    </p>

    <div class="card">
      <form class="form" @submit.prevent="saveSettings">
        <div class="form__row">
          <label class="form__label" for="salon-name">Название компании</label>
          <input
            id="salon-name"
            v-model="salonName"
            class="form__input form__input--grow"
            type="text"
            placeholder="Например, «Ромашка»"
          />
          <span class="form__hint">
            Если оставить пустым — помощник представится нейтрально: «наша компания».
          </span>
        </div>

        <div class="form__block">
          <span class="form__label">Логотип</span>
          <p class="form__hint">
            Логотип показывается клиенту в чате и на странице заявок. Пока его нет — показывается название компании.
          </p>

          <div class="logo-row">
            <img v-if="logoHash" class="logo-preview" :src="logoPreviewUrl" :alt="salonName" />
            <span v-else class="logo-placeholder">{{ salonName }}</span>

            <div class="row-actions">
              <label class="button button--small logo-upload">
                {{ logoHash ? 'Заменить' : 'Загрузить логотип' }}
                <input type="file" accept="image/*" :disabled="uploadingLogo" @change="onLogoPicked" />
              </label>
              <button
                v-if="logoHash"
                type="button"
                class="status-btn"
                :disabled="uploadingLogo"
                @click="removeLogo"
              >
                Удалить логотип
              </button>
            </div>
          </div>

          <p v-if="logoStatus" class="form__saved">{{ logoStatus }}</p>
          <p v-if="logoError" class="notice">{{ logoError }}</p>
        </div>

        <div class="form__row">
          <label class="form__label" for="workday-start">Работаем с</label>
          <input id="workday-start" v-model="workdayStart" class="form__input form__input--time" type="time" required />
          <label class="form__label" for="workday-end">до</label>
          <input id="workday-end" v-model="workdayEnd" class="form__input form__input--time" type="time" required />
        </div>

        <div class="form__row">
          <label class="form__label" for="slot-minutes">Одно окно длится</label>
          <select id="slot-minutes" v-model.number="slotMinutes" class="form__input form__input--select">
            <option :value="30">30 минут</option>
            <option :value="60">1 час</option>
            <option :value="90">1,5 часа</option>
            <option :value="120">2 часа</option>
            <option :value="180">3 часа</option>
          </select>
        </div>

        <fieldset class="form__fieldset">
          <legend class="form__label">Выходные дни</legend>
          <label v-for="day in weekdays" :key="day.value" class="form__check">
            <input v-model="daysOff" type="checkbox" :value="day.value" />
            <span>{{ day.label }}</span>
          </label>
        </fieldset>

        <div class="form__row">
          <label class="form__label" for="reminder-hour">Присылать напоминание о завтрашних визитах в</label>
          <input id="reminder-hour" v-model="reminderHour" class="form__input form__input--time" type="time" required />
        </div>

        <p v-if="error" class="notice">{{ error }}</p>
        <p v-if="saved" class="form__saved">Настройки сохранены</p>

        <div class="form__actions">
          <button class="button" type="submit" :disabled="saving">
            {{ saving ? 'Сохраняем…' : 'Сохранить' }}
          </button>
          <span class="form__hint">Сейчас: {{ summary }}</span>
        </div>
      </form>
    </div>

    <h2 class="page__section">Прайс</h2>
    <p class="page__subtitle">
      Добавляйте любые услуги и цены. Помощник называет клиенту только те цены, что есть здесь;
      если услуги в списке нет — он скажет, что стоимость уточнит администратор.
    </p>

    <div class="card">
      <div class="toolbar">
        <span class="toolbar__count">{{ priceCountText }}</span>
      </div>

      <form class="form form--inline" @submit.prevent="addPrice">
        <input
          v-model="newTitle"
          class="form__input form__input--grow"
          type="text"
          placeholder="Например, «Консультация специалиста»"
          aria-label="Название услуги"
        />
        <input
          v-model.number="newPrice"
          class="form__input form__input--price"
          type="number"
          min="0"
          step="50"
          placeholder="Цена, ₽"
          aria-label="Цена"
        />
        <button class="button" type="submit" :disabled="adding || !newTitle.trim()">
          {{ adding ? 'Добавляем…' : 'Добавить' }}
        </button>
      </form>

      <p v-if="priceError" class="notice">{{ priceError }}</p>

      <p v-if="!prices.length" class="empty">
        Прайс пока пустой. Добавьте первую услугу — и помощник сможет называть её цену.
      </p>

      <div v-else class="table-wrap">
        <table class="leads">
          <thead>
            <tr>
              <th>Услуга</th>
              <th>Цена</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in prices" :key="item.id">
              <template v-if="editingId === item.id">
                <td>
                  <input
                    v-model="editTitle"
                    class="form__input form__input--grow"
                    type="text"
                    aria-label="Название услуги"
                  />
                </td>
                <td>
                  <input
                    v-model.number="editPrice"
                    class="form__input form__input--price"
                    type="number"
                    min="0"
                    step="50"
                    aria-label="Цена"
                  />
                </td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="button button--small" :disabled="savingEdit" @click="saveEdit(item)">
                      {{ savingEdit ? 'Сохраняем…' : 'Сохранить' }}
                    </button>
                    <button type="button" class="status-btn" :disabled="savingEdit" @click="cancelEdit">
                      Отмена
                    </button>
                  </div>
                </td>
              </template>
              <template v-else>
                <td>{{ item.title }}</td>
                <td class="leads__phone">{{ item.priceText }}</td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="status-btn" :disabled="busyId === item.id" @click="startEdit(item)">
                      Редактировать
                    </button>
                    <button type="button" class="status-btn" :disabled="busyId === item.id" @click="removePrice(item)">
                      Удалить
                    </button>
                  </div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <h2 class="page__section">Демо-данные</h2>
    <p class="page__subtitle">
      Пример прайса сервисной компании и три заявки в разных статусах — чтобы сразу посмотреть,
      как работает помощник. Имена и телефоны в примерах выдуманные, убираются одной кнопкой.
    </p>

    <div class="card">
      <div class="toolbar">
        <span class="toolbar__count">{{ demoStatus || 'Демо-данные не добавлены' }}</span>
        <div class="toolbar__actions">
          <button type="button" class="button" :disabled="seeding" @click="seed('')">
            {{ seeding ? 'Заполняем…' : 'Наполнить демо-данными' }}
          </button>
          <button type="button" class="button button--ghost" :disabled="seeding" @click="seed('1')">
            Убрать демо-данные
          </button>
        </div>
      </div>
    </div>

    <p class="page__nav"><a :href="leadsUrl">← К списку заявок</a></p>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getThumbnailUrl, obtainStorageFilePutUrl } from '@app/storage'
import { settingsSaveRoute } from '../api/settings/save'
import { settingsLogoRoute } from '../api/settings/logo'
import { priceAddRoute } from '../api/prices/add'
import { priceRemoveRoute } from '../api/prices/remove'
import { priceUpdateRoute } from '../api/prices/update'
import { seedRoute } from '../api/seed'

type PriceItem = { id: string; title: string; amount: number; priceText: string }

const props = defineProps<{
  settings: {
    salonName: string
    logoHash: string
    workdayStart: string
    workdayEnd: string
    slotMinutes: number
    daysOff: number[]
    reminderHour: string
  }
  prices: PriceItem[]
  leadsUrl: string
}>()

const weekdays = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 0, label: 'Вс' },
]

const weekdayNames: Record<number, string> = {
  0: 'воскресенье',
  1: 'понедельник',
  2: 'вторник',
  3: 'среда',
  4: 'четверг',
  5: 'пятница',
  6: 'суббота',
}

const salonName = ref(props.settings.salonName)
const logoHash = ref(props.settings.logoHash)
const uploadingLogo = ref(false)
const logoStatus = ref('')
const logoError = ref('')

const workdayStart = ref(props.settings.workdayStart)
const workdayEnd = ref(props.settings.workdayEnd)
const slotMinutes = ref(props.settings.slotMinutes)
const daysOff = ref<number[]>([...props.settings.daysOff])
const reminderHour = ref(props.settings.reminderHour)

const saving = ref(false)
const saved = ref(false)
const error = ref('')

const prices = ref<PriceItem[]>([...props.prices])
const newTitle = ref('')
const newPrice = ref<number | null>(null)
const adding = ref(false)
const busyId = ref('')
const priceError = ref('')

const editingId = ref('')
const editTitle = ref('')
const editPrice = ref<number | null>(null)
const savingEdit = ref(false)
const seeding = ref(false)
const demoStatus = ref('')

const priceCountText = computed(() => {
  const total = prices.value.length
  if (!total) return 'Прайс пустой'
  return total === 1 ? '1 услуга' : `Всего услуг: ${total}`
})

const summary = computed(() => {
  const off = daysOff.value.length
    ? daysOff.value
        .slice()
        .sort((a, b) => a - b)
        .map(day => weekdayNames[day])
        .join(', ')
    : 'нет'
  return `с ${workdayStart.value} до ${workdayEnd.value}, окно ${slotMinutes.value} мин, выходные: ${off}, напоминания в ${reminderHour.value}`
})

const logoPreviewUrl = computed(() =>
  logoHash.value ? getThumbnailUrl(ctx, logoHash.value, 240) : '',
)

async function applyLogoHash(hash: string, message: string) {
  const result = await settingsLogoRoute.run(ctx, { logoHash: hash })
  if (!result.success) {
    logoError.value = result.error ?? 'Не удалось сохранить логотип'
    return
  }
  logoHash.value = result.logoHash ?? ''
  logoStatus.value = message
}

async function onLogoPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  logoStatus.value = ''
  logoError.value = ''

  if (!file.type.startsWith('image/')) {
    logoError.value = 'Нужен файл-картинка: png, jpg, svg или webp'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    logoError.value = 'Файл слишком большой — до 5 МБ'
    return
  }

  uploadingLogo.value = true
  try {
    const putUrl = await obtainStorageFilePutUrl(ctx)
    const form = new FormData()
    form.append('Filedata', file)

    const response = await fetch(putUrl, { method: 'POST', body: form })
    if (!response.ok) {
      logoError.value = `Не удалось загрузить файл (ошибка ${response.status})`
      return
    }

    const hash = (await response.text()).trim()
    if (!hash) {
      logoError.value = 'Хранилище не вернуло файл — попробуйте ещё раз'
      return
    }

    await applyLogoHash(hash, 'Логотип загружен')
  } catch {
    logoError.value = 'Не удалось загрузить логотип. Попробуйте ещё раз.'
  } finally {
    uploadingLogo.value = false
  }
}

async function removeLogo() {
  uploadingLogo.value = true
  logoStatus.value = ''
  logoError.value = ''
  try {
    await applyLogoHash('', 'Логотип удалён — показывается название компании')
  } catch {
    logoError.value = 'Не удалось удалить логотип. Попробуйте ещё раз.'
  } finally {
    uploadingLogo.value = false
  }
}

async function saveSettings() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    const result = await settingsSaveRoute.run(ctx, {
      salonName: salonName.value,
      workdayStart: workdayStart.value,
      workdayEnd: workdayEnd.value,
      slotMinutes: slotMinutes.value,
      daysOff: daysOff.value,
      reminderHour: reminderHour.value,
    })
    if (!result.success) {
      error.value = result.error ?? 'Не удалось сохранить настройки'
      return
    }
    saved.value = true
  } catch {
    error.value = 'Не удалось сохранить настройки. Попробуйте ещё раз.'
  } finally {
    saving.value = false
  }
}

async function addPrice() {
  const title = newTitle.value.trim()
  if (!title || adding.value) return

  adding.value = true
  priceError.value = ''
  try {
    const result = await priceAddRoute.run(ctx, {
      title,
      price: newPrice.value ?? 0,
    })
    if (!result.success) {
      priceError.value = result.error ?? 'Не удалось добавить услугу'
      return
    }
    prices.value = result.items ?? []
    newTitle.value = ''
    newPrice.value = null
  } catch {
    priceError.value = 'Не удалось добавить услугу. Попробуйте ещё раз.'
  } finally {
    adding.value = false
  }
}

async function removePrice(item: PriceItem) {
  if (busyId.value) return

  busyId.value = item.id
  priceError.value = ''
  try {
    const result = await priceRemoveRoute.query({ id: item.id }).run(ctx)
    if (!result.success) {
      priceError.value = 'Не удалось удалить услугу'
      return
    }
    prices.value = result.items ?? []
    if (editingId.value === item.id) cancelEdit()
  } catch {
    priceError.value = 'Не удалось удалить услугу. Попробуйте ещё раз.'
  } finally {
    busyId.value = ''
  }
}

function startEdit(item: PriceItem) {
  editingId.value = item.id
  editTitle.value = item.title
  editPrice.value = item.amount
  priceError.value = ''
}

function cancelEdit() {
  editingId.value = ''
  editTitle.value = ''
  editPrice.value = null
  priceError.value = ''
}

async function saveEdit(item: PriceItem) {
  const title = editTitle.value.trim()
  if (!title || savingEdit.value) return

  savingEdit.value = true
  priceError.value = ''
  try {
    const result = await priceUpdateRoute.query({ id: item.id }).run(ctx, {
      title,
      price: editPrice.value ?? 0,
    })
    if (!result.success) {
      priceError.value = result.error ?? 'Не удалось сохранить изменения'
      return
    }
    prices.value = result.items ?? []
    cancelEdit()
  } catch {
    priceError.value = 'Не удалось сохранить изменения. Попробуйте ещё раз.'
  } finally {
    savingEdit.value = false
  }
}

/**
 * Демо-данные шаблона: прайс и примеры заявок. Без параметра — наполнить, `reset: '1'` — убрать.
 */
async function seed(reset: string) {
  if (seeding.value) return

  seeding.value = true
  demoStatus.value = ''
  try {
    const result = await seedRoute.query({ reset }).run(ctx)
    if (!result.success) {
      demoStatus.value = 'Не получилось заполнить демо-данные'
      return
    }

    prices.value = result.items ?? []
    demoStatus.value = result.reset
      ? 'Демо-данные убраны'
      : `Добавлено: услуг ${result.addedPrices}, заявок ${result.addedLeads}`
  } catch {
    demoStatus.value = 'Не удалось заполнить демо-данные. Попробуйте ещё раз.'
  } finally {
    seeding.value = false
  }
}
</script>
