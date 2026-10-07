import SalonSettingsTable from '../tables/salon-settings.table'

export type SalonSettings = {
  /** Название компании — показывается клиенту, если логотип не загружен. */
  salonName: string
  /** Хеш файла логотипа в хранилище аккаунта; пустая строка — логотипа нет. */
  logoHash: string
  /** Начало рабочего дня, `ЧЧ:ММ`. */
  workdayStart: string
  /** Конец рабочего дня, `ЧЧ:ММ`. */
  workdayEnd: string
  /** Длительность одного окна записи в минутах. */
  slotMinutes: number
  /** Выходные дни недели: 0 — воскресенье, 1 — понедельник, … 6 — суббота. */
  daysOff: number[]
  /** Во сколько присылать напоминание о завтрашних визитах, `ЧЧ:ММ`. */
  reminderHour: string
  /** Часовой пояс компании в виде смещения от UTC, например `+03:00`. */
  timeZone: string
}

/** Значения, которые действуют, пока владелец не сохранил свои настройки. */
export const defaultSalonSettings: SalonSettings = {
  // Пустое название — нейтральный старт: помощник представляется «наша компания»,
  // пока владелец не заполнит название в настройках.
  salonName: '',
  logoHash: '',
  workdayStart: '10:00',
  workdayEnd: '20:00',
  slotMinutes: 60,
  daysOff: [0],
  reminderHour: '18:00',
  timeZone: '+03:00',
}

export async function getSalonSettings(ctx: app.Ctx): Promise<SalonSettings> {
  const rows = await SalonSettingsTable.findAll(ctx, {
    limit: 1,
    order: [{ createdAt: 'asc' }],
  })
  const row = rows[0]
  if (!row) return defaultSalonSettings

  return {
    // Пустое название — осознанный выбор владельца, значение по умолчанию
    // подставляем только когда настроек ещё нет вовсе.
    salonName: row.salonName ?? '',
    logoHash: row.logoHash ?? defaultSalonSettings.logoHash,
    workdayStart: row.workdayStart || defaultSalonSettings.workdayStart,
    workdayEnd: row.workdayEnd || defaultSalonSettings.workdayEnd,
    slotMinutes: row.slotMinutes || defaultSalonSettings.slotMinutes,
    daysOff: row.daysOff ?? defaultSalonSettings.daysOff,
    reminderHour: row.reminderHour || defaultSalonSettings.reminderHour,
    timeZone: row.timeZone || defaultSalonSettings.timeZone,
  }
}

export async function saveSalonSettings(ctx: app.Ctx, settings: SalonSettings): Promise<SalonSettings> {
  const rows = await SalonSettingsTable.findAll(ctx, {
    limit: 1,
    order: [{ createdAt: 'asc' }],
  })
  const row = rows[0]

  if (row) {
    await SalonSettingsTable.update(ctx, { id: row.id, ...settings })
  } else {
    await SalonSettingsTable.create(ctx, settings)
  }

  return settings
}

/** `ЧЧ:ММ` → минуты от начала суток; `null`, если формат неверный. */
export function parseTimeOfDay(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/** Минуты от начала суток → `ЧЧ:ММ`. */
export function formatTimeOfDay(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}
