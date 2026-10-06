import Leads from '../tables/leads.table'
import type { SalonSettings } from './salon-settings'
import { parseTimeOfDay } from './salon-settings'

const WEEKDAY_NAMES = [
  'воскресенье',
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
]

const WEEKDAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

const MONTH_NAMES = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

/** Насколько далеко вперёд ищем свободные окна. */
const HORIZON_DAYS = 21

/** Смещение часового пояса салона от UTC в минутах. */
export function offsetMinutes(timeZone: string): number {
  const match = /^([+-])(\d{1,2}):?(\d{2})$/.exec(timeZone.trim())
  if (!match) return 180
  const sign = match[1] === '-' ? -1 : 1
  return sign * (Number(match[2]) * 60 + Number(match[3]))
}

type WallClock = { y: number; m: number; d: number; hh: number; mm: number; weekday: number }

/** Момент времени → настенные часы салона. */
export function instantToWall(settings: SalonSettings, date: Date): WallClock {
  const shifted = new Date(date.getTime() + offsetMinutes(settings.timeZone) * 60000)
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    hh: shifted.getUTCHours(),
    mm: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  }
}

/** Настенные часы салона → момент времени. */
export function wallToInstant(
  settings: SalonSettings,
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
): Date {
  const utc = Date.UTC(y, m - 1, d, hh, mm, 0, 0)
  return new Date(utc - offsetMinutes(settings.timeZone) * 60000)
}

export function parseDateInput(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim())
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  return { y, m, d }
}

export function parseTimeInput(value: string): { hh: number; mm: number } | null {
  const match = /^(\d{1,2})[:.\s]?(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hh = Number(match[1])
  const mm = Number(match[2])
  if (hh > 23 || mm > 59) return null
  return { hh, mm }
}

/** «четверг, 8 октября, 14:00» */
export function formatSlotFull(settings: SalonSettings, date: Date): string {
  const wall = instantToWall(settings, date)
  const weekday = WEEKDAY_NAMES[wall.weekday] ?? ''
  const month = MONTH_NAMES[wall.m - 1] ?? ''
  const time = `${String(wall.hh).padStart(2, '0')}:${String(wall.mm).padStart(2, '0')}`
  return `${weekday}, ${wall.d} ${month}, ${time}`
}

/** «чт, 08.10, 14:00» — короткая подпись для таблицы заявок. */
export function formatSlotShort(settings: SalonSettings, date: Date): string {
  const wall = instantToWall(settings, date)
  const weekday = WEEKDAY_SHORT[wall.weekday] ?? ''
  const day = String(wall.d).padStart(2, '0')
  const month = String(wall.m).padStart(2, '0')
  const time = `${String(wall.hh).padStart(2, '0')}:${String(wall.mm).padStart(2, '0')}`
  return `${weekday}, ${day}.${month}, ${time}`
}

/** Рабочие часы и выходные одной фразой — для сообщений агента. */
export function describeSchedule(settings: SalonSettings): string {
  const days = settings.daysOff
    .slice()
    .sort((a, b) => a - b)
    .map(day => WEEKDAY_NAMES[day])
    .filter(Boolean)
  const off = days.length ? ` Выходные: ${days.join(', ')}.` : ''
  return `Салон работает с ${settings.workdayStart} до ${settings.workdayEnd}, одно окно — ${settings.slotMinutes} мин.${off}`
}

type Interval = { start: number; end: number }

async function loadBusyIntervals(
  ctx: app.Ctx,
  from: Date,
  to: Date,
  slotMs: number,
  ignoreLeadId?: string,
): Promise<Interval[]> {
  const rows = await Leads.findAll(ctx, {
    where: { visitStart: { $gte: new Date(from.getTime() - slotMs), $lt: to } },
    limit: 1000,
  })

  const intervals: Interval[] = []
  for (const row of rows) {
    if (!row.visitStart) continue
    if (ignoreLeadId && row.id === ignoreLeadId) continue
    intervals.push({ start: row.visitStart.getTime(), end: row.visitStart.getTime() + slotMs })
  }
  return intervals
}

function overlaps(intervals: Interval[], start: number, end: number): boolean {
  return intervals.some(item => start < item.end && item.start < end)
}

function slotMinutes(settings: SalonSettings): number {
  return settings.slotMinutes > 0 ? settings.slotMinutes : 60
}

/** Сдвигает календарный день на указанное число суток. */
export function addDays(y: number, m: number, d: number, days: number) {
  const shifted = new Date(Date.UTC(y, m - 1, d + days))
  return { y: shifted.getUTCFullYear(), m: shifted.getUTCMonth() + 1, d: shifted.getUTCDate() }
}

/** Все начала окон в рабочем дне — в минутах от полуночи. */
function daySlotStarts(settings: SalonSettings): number[] {
  const start = parseTimeOfDay(settings.workdayStart) ?? 600
  const end = parseTimeOfDay(settings.workdayEnd) ?? 1200
  const step = slotMinutes(settings)
  const out: number[] = []
  for (let minutes = start; minutes + step <= end; minutes += step) out.push(minutes)
  return out
}

/** Ближайшие свободные окна, начиная с указанного момента. */
export async function findFreeSlots(
  ctx: app.Ctx,
  settings: SalonSettings,
  from: Date,
  count: number,
  ignoreLeadId?: string,
): Promise<Date[]> {
  const step = slotMinutes(settings)
  const stepMs = step * 60000
  const now = Date.now()
  const startWall = instantToWall(settings, from)

  const horizonEnd = wallToInstant(
    settings,
    ...(Object.values(addDays(startWall.y, startWall.m, startWall.d, HORIZON_DAYS)) as [number, number, number]),
    0,
    0,
  )
  const busy = await loadBusyIntervals(ctx, from, horizonEnd, stepMs, ignoreLeadId)

  const out: Date[] = []
  for (let dayIndex = 0; dayIndex < HORIZON_DAYS && out.length < count; dayIndex++) {
    const day = addDays(startWall.y, startWall.m, startWall.d, dayIndex)
    const weekday = new Date(Date.UTC(day.y, day.m - 1, day.d)).getUTCDay()
    if (settings.daysOff.includes(weekday)) continue

    for (const minutes of daySlotStarts(settings)) {
      const instant = wallToInstant(
        settings,
        day.y,
        day.m,
        day.d,
        Math.floor(minutes / 60),
        minutes % 60,
      )
      if (instant.getTime() <= now) continue
      // В первый день не предлагаем окна раньше запрошенного времени:
      // клиенту нужно ближайшее свободное ПОСЛЕ названного времени.
      if (instant.getTime() < from.getTime()) continue
      if (overlaps(busy, instant.getTime(), instant.getTime() + stepMs)) continue
      out.push(instant)
      if (out.length >= count) break
    }
  }

  return out
}

export type SlotStatus = 'free' | 'busy' | 'closed' | 'outside' | 'past' | 'invalid'

export type SlotCheckResult = {
  status: SlotStatus
  /** Подпись запрошенного времени, если оно разобрано. */
  slotLabel: string
  /** Момент начала запрошенного визита, если время разобрано. */
  start: Date | null
  /** Готовый текст для агента. */
  message: string
  alternatives: Date[]
}

function alternativesText(settings: SalonSettings, alternatives: Date[]): string {
  if (!alternatives.length) {
    return ' Ближайших свободных окон в следующие три недели нет.'
  }
  return ` Ближайшие свободные окна: ${alternatives.map(item => formatSlotFull(settings, item)).join('; ')}.`
}

/** Проверяет, свободно ли названное клиентом окно. */
export async function checkSlot(
  ctx: app.Ctx,
  settings: SalonSettings,
  dateInput: string,
  timeInput: string,
  ignoreLeadId?: string,
): Promise<SlotCheckResult> {
  const date = parseDateInput(dateInput)
  const time = parseTimeInput(timeInput)

  if (!date || !time) {
    return {
      status: 'invalid',
      slotLabel: '',
      start: null,
      message:
        'НЕ ПОНЯЛ ДАТУ ИЛИ ВРЕМЯ. Нужны дата в формате ГГГГ-ММ-ДД и время в формате ЧЧ:ММ. Переспроси у клиента, на какой день и час он хочет записаться.',
      alternatives: [],
    }
  }

  const step = slotMinutes(settings)
  const stepMs = step * 60000
  const instant = wallToInstant(settings, date.y, date.m, date.d, time.hh, time.mm)
  const label = formatSlotFull(settings, instant)

  if (instant.getTime() <= Date.now()) {
    const alternatives = await findFreeSlots(ctx, settings, new Date(), 3, ignoreLeadId)
    return {
      status: 'past',
      slotLabel: label,
      start: instant,
      message: `ЭТО ВРЕМЯ УЖЕ ПРОШЛО: ${label}.${alternativesText(settings, alternatives)}`,
      alternatives,
    }
  }

  const weekday = new Date(Date.UTC(date.y, date.m - 1, date.d)).getUTCDay()
  if (settings.daysOff.includes(weekday)) {
    const alternatives = await findFreeSlots(ctx, settings, instant, 3, ignoreLeadId)
    return {
      status: 'closed',
      slotLabel: label,
      start: instant,
      message: `ВЫХОДНОЙ: ${label} — салон не работает. ${describeSchedule(settings)}${alternativesText(settings, alternatives)}`,
      alternatives,
    }
  }

  const workStart = parseTimeOfDay(settings.workdayStart) ?? 600
  const workEnd = parseTimeOfDay(settings.workdayEnd) ?? 1200
  const minutes = time.hh * 60 + time.mm
  if (minutes < workStart || minutes + step > workEnd) {
    const alternatives = await findFreeSlots(ctx, settings, instant, 3, ignoreLeadId)
    return {
      status: 'outside',
      slotLabel: label,
      start: instant,
      message: `ВНЕ РАБОЧИХ ЧАСОВ: ${label}. ${describeSchedule(settings)}${alternativesText(settings, alternatives)}`,
      alternatives,
    }
  }

  const busy = await loadBusyIntervals(
    ctx,
    instant,
    new Date(instant.getTime() + stepMs),
    stepMs,
    ignoreLeadId,
  )
  if (overlaps(busy, instant.getTime(), instant.getTime() + stepMs)) {
    const alternatives = await findFreeSlots(ctx, settings, instant, 3, ignoreLeadId)
    return {
      status: 'busy',
      slotLabel: label,
      start: instant,
      message: `ЗАНЯТО: ${label} — на это время уже есть запись.${alternativesText(settings, alternatives)}`,
      alternatives,
    }
  }

  return {
    status: 'free',
    slotLabel: label,
    start: instant,
    message: `СВОБОДНО: ${label}. Это время можно предложить клиенту.`,
    alternatives: [],
  }
}
