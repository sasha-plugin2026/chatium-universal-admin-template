<template>
  <section class="chat" :aria-busy="loading">
    <div ref="feedEl" class="chat__feed" aria-live="polite">
      <p v-if="loading" class="chat__hint">Загружаем переписку…</p>
      <template v-else>
        <p v-if="!visibleMessages.length" class="chat__hint">
          Здравствуйте! Секунду, помощник уже отвечает…
        </p>
        <div
          v-for="m in visibleMessages"
          :key="m.id"
          class="msg"
          :class="isMine(m) ? 'msg--mine' : 'msg--agent'"
        >
          <div class="msg__bubble">
            {{ cleanText(m.text) }}<span v-if="m.pending" class="msg__pending"> · отправляется</span>
          </div>
        </div>
      </template>
    </div>

    <form class="chat__form" @submit.prevent="submit">
      <input
        v-model="draft"
        class="chat__input"
        type="text"
        placeholder="Напишите сообщение…"
        aria-label="Сообщение"
        :disabled="sending"
      />
      <button class="button" type="submit" :disabled="sending || !draft.trim()">Отправить</button>
    </form>

    <p v-if="problem" class="notice">{{ problem }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useChatClient } from '@start/sdk/chatClient/vue'
import type { ChatClientMessage } from '@start/sdk/chatClient/vue'

const props = defineProps<{ agentId: string; agentToken: string }>()

// transport.key должен совпадать с zayavkiTransportKey на сервере (index.tsx)
const { messages, me, loading, error, send, agentLinked } = useChatClient({
  transport: { key: 'zayavki-chat', title: 'Приём заявок' },
  chat: { externalId: 'zayavki' },
  agentId: props.agentId || undefined,
  agentToken: props.agentToken || undefined,
})

const draft = ref('')
const sending = ref(false)
const localError = ref('')
const feedEl = ref<HTMLElement | null>(null)

/**
 * Первое сообщение отправляем сами, чтобы помощник поздоровался первым
 * («Начать» нажимать не нужно). Клиент видит только ответ помощника.
 */
const autoStartText = 'Здравствуйте!'
const autoStartSent = ref(false)

const visibleMessages = computed(() =>
  messages.value.filter(m => m.data?.autoStart !== true),
)

const problem = computed(() => {
  if (localError.value) return localError.value
  if (agentLinked.value === false) return 'Помощник сейчас недоступен, попробуйте обновить страницу.'
  return error.value
})

function isMine(m: ChatClientMessage) {
  return m.createdBy === me.value
}

/**
 * Иногда платформа дописывает к ответу модели служебное слово про её размышления.
 * Клиенту это видеть не нужно, поэтому убираем такой «хвост».
 */
function cleanText(text: string | null) {
  if (!text) return ''
  return text.replace(/\n+(thought|t)\s*$/i, '').trim()
}

async function scrollToEnd() {
  await nextTick()
  const el = feedEl.value
  if (el) el.scrollTop = el.scrollHeight
}

watch(() => visibleMessages.value.length, scrollToEnd)

async function sendText(text: string, data?: Record<string, unknown>) {
  const value = text.trim()
  if (!value || sending.value) return
  sending.value = true
  localError.value = ''
  try {
    await send(value, data ? { data } : undefined)
  } catch {
    localError.value = 'Не удалось отправить сообщение. Попробуйте ещё раз.'
  } finally {
    sending.value = false
    await scrollToEnd()
  }
}

async function submit() {
  const value = draft.value
  draft.value = ''
  await sendText(value)
}

// Когда переписка загрузилась и она пустая — знакомимся от имени клиента.
watch(
  [loading, visibleMessages],
  async ([isLoading, list]) => {
    if (isLoading || autoStartSent.value) return
    autoStartSent.value = true
    if (list.length) return
    await sendText(autoStartText, { autoStart: true })
  },
  { immediate: true },
)
</script>
