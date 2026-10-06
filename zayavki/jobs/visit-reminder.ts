import Leads from '../tables/leads.table'
import type { SalonSettings } from '../server/salon-settings'
import { reminderMomentFor, remindAboutVisit } from '../server/visit-reminders'

/**
 * Задача напоминания о визите. Заводится на каждую заявку со временем визита
 * и срабатывает за день до визита, в час напоминания из настроек салона.
 */
export const visitReminderJob = app
  .job('/')
  .body(s => ({ leadId: s.string() }))
  .handle(async (ctx, params) => {
    const result = await remindAboutVisit(ctx, params.leadId)
    ctx.account.log('visitReminderJob', {
      json: { leadId: params.leadId, sent: result.sent, reason: result.reason },
    })
    return result
  })

/**
 * Ставит напоминание для заявки: на нужный час, а если он уже прошёл,
 * но визит ещё впереди — как можно скорее.
 */
export async function scheduleVisitReminder(
  ctx: app.Ctx,
  settings: SalonSettings,
  lead: typeof Leads.T,
): Promise<void> {
  if (!lead.visitStart) return
  if (lead.visitStart.getTime() <= Date.now()) return

  const moment = reminderMomentFor(settings, lead.visitStart)
  if (moment.getTime() > Date.now()) {
    await visitReminderJob.scheduleJobAt(ctx, moment, { leadId: lead.id })
    return
  }

  await visitReminderJob.scheduleJobAsap(ctx, { leadId: lead.id })
}
