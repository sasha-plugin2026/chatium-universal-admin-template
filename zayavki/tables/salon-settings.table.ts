import { Heap } from '@app/heap'

/**
 * Настройки салона: одна запись на аккаунт.
 * Если записи нет, используются значения по умолчанию из server/salon-settings.ts.
 */
const SalonSettings = Heap.Table(
  't_salon_settings_Q4W8Z2',
  {
    salonName: Heap.String({ customMeta: { title: 'Название салона' } }),
    logoHash: Heap.Optional(
      Heap.String({ customMeta: { title: 'Логотип (файл в хранилище)' } }),
    ),
    workdayStart: Heap.String({ customMeta: { title: 'Начало рабочего дня' } }),
    workdayEnd: Heap.String({ customMeta: { title: 'Конец рабочего дня' } }),
    slotMinutes: Heap.Number({ customMeta: { title: 'Длительность окна, минут' } }),
    daysOff: Heap.Array(Heap.Number({ customMeta: { title: 'День недели' } }), {
      customMeta: { title: 'Выходные дни (0 — воскресенье)' },
    }),
    reminderHour: Heap.String({ customMeta: { title: 'Время напоминания о визитах' } }),
    timeZone: Heap.String({ customMeta: { title: 'Часовой пояс салона' } }),
  },
  {
    customMeta: {
      title: 'Настройки салона',
      description: 'Рабочие часы салона, выходные и длительность окна записи',
    },
  },
)

export default SalonSettings
