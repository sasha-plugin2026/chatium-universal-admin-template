import Leads from '../tables/leads.table'
import { notifyStaffAboutVisit } from './leads-notify'
import type { SalonSettings } from './salon-settings'
import { getSalonSettings, parseTimeOfDay } from './salon-settings'
import { addDays, instantToWall, wallToInstant } from './slots'

/**
 * Когда напоминать о визите: за день до него, в час напоминания из настроек.
 * Например, для визита в среду 14:00 и часа напоминания 18:00 — во вторник в 18:00.
 */
export function reminderMomentFor(settings: SalonSettings, visitStart: Date): Date {
  const wall = instantToWall(settings, visitStart)
  const dayBefore = addDays(wall.y, wall.m, wall.d, -1)
  const hour = parseTimeOfDay(settings.reminderHour) ?? 1080
  return wallToInstant(
    settings,
    dayBefore.y,
    dayBefore.m,
    dayBefore.d,
    Math.floor(hour / 60),
    hour % 60,
  )
}

/** «14:00» — время визита в часах компании. */
function visitTimeText(settings: SalonSettings, visitStart: Date): string {
  const wall = instantToWall(settings, visitStart)
  return `${String(wall.hh).padStart(2, '0')}:${String(wall.mm).padStart(2, '0')}`
}

/**
 * Отправляет напоминание о визите, если оно уместно:
 * визит ещё не прошёл, он назначен на завтра и напоминание по этому времени ещё не уходило.
 * Повторный запуск безопасен.
 */
export async function remindAboutVisit(
  ctx: app.Ctx,
  leadId: string,
): Promise<{ sent: boolean; reason: string }> {
  const lead = await Leads.findById(ctx, leadId)
  if (!lead) return { sent: false, reason: 'заявка не найдена' }
  if (!lead.visitStart) return { sent: false, reason: 'у заявки нет времени визита' }
  if (lead.status === 'done') return { sent: false, reason: 'заявка уже закрыта' }

  const alreadySent =
    lead.reminderSentAt &&
    lead.reminderForStart &&
    lead.reminderForStart.getTime() === lead.visitStart.getTime()
  if (alreadySent) return { sent: false, reason: 'напоминание уже отправлено' }

  const settings = await getSalonSettings(ctx)
  const now = new Date()
  if (lead.visitStart.getTime() <= now.getTime()) {
    return { sent: false, reason: 'визит уже прошёл' }
  }

  const nowWall = instantToWall(settings, now)
  const visitWall = instantToWall(settings, lead.visitStart)
  const tomorrow = addDays(nowWall.y, nowWall.m, nowWall.d, 1)
  const isTomorrow =
    visitWall.y === tomorrow.y && visitWall.m === tomorrow.m && visitWall.d === tomorrow.d
  if (!isTomorrow) return { sent: false, reason: 'визит не завтра' }

  await notifyStaffAboutVisit(ctx, {
    leadId: lead.id,
    timeText: visitTimeText(settings, lead.visitStart),
    name: lead.name,
    service: lead.service,
  })

  await Leads.update(ctx, {
    id: lead.id,
    reminderSentAt: now,
    reminderForStart: lead.visitStart,
  })

  return { sent: true, reason: 'напоминание отправлено' }
}
