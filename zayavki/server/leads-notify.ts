import { sendNotification } from '@store/sdk'
import Leads from '../tables/leads.table'
import { leadsPageRoute } from '../leads'

/** Типы уведомлений плагина: по этим ключам получатель настраивает их в Store. */
const NEW_LEAD_TYPE = 'lead.created'
const VISIT_REMINDER_TYPE = 'visit.reminder'

/** Кому адресованы уведомления — сотрудникам аккаунта. Клиентов и ботов Store отсеивает сам. */
const STAFF_ROLES = ['Staff', 'Admin', 'Developer', 'Owner'] as const

type StaffNotification = {
  /** Устойчивый id события: повторная отправка обновляет уведомление, а не создаёт второе. */
  id: string
  typeKey: string
  title: string
  text: string
}

/**
 * Кладёт сотрудникам уведомление через Store (пункт в Inbox и запись в общем Feed плагина).
 * Телефон клиента в текст не попадает: он виден на странице заявок, которую открывает ссылка.
 * Ошибка уведомления не должна ломать основное действие, поэтому она только логируется.
 */
async function notifyStaff(ctx: app.Ctx, logName: string, message: StaffNotification) {
  try {
    const result = await sendNotification(ctx, {
      id: message.id,
      recipients: { accountRoles: [...STAFF_ROLES] },
      typeKey: message.typeKey,
      title: message.title,
      text: message.text,
      url: leadsPageRoute.path(),
    })

    // Итог отправки нужен в журнале аккаунта: dispatch может быть queued или skipped,
    // если у аккаунта не нашлось ни одного получателя с ролью Staff+.
    ctx.account.log(logName, {
      json: {
        id: message.id,
        state: result.state,
        eligible: result.eligibleCount,
        filtered: result.filteredCount,
      },
    })

    return { ok: true as const, result }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err)
    ctx.account.log(`${logName} failed`, { json: { id: message.id, error } })
    return { ok: false as const, error }
  }
}

/** Уведомление о новой заявке. */
export async function notifyStaffAboutNewLead(ctx: app.Ctx, lead: typeof Leads.T) {
  return notifyStaff(ctx, 'notifyStaffAboutNewLead', {
    id: `lead:${lead.id}`,
    typeKey: NEW_LEAD_TYPE,
    title: 'Новая заявка',
    text: `${lead.name} — ${lead.service}`,
  })
}

/** Напоминание позвонить и подтвердить завтрашний визит. */
export async function notifyStaffAboutVisit(
  ctx: app.Ctx,
  params: { leadId: string; timeText: string; name: string; service: string },
) {
  return notifyStaff(ctx, 'notifyStaffAboutVisit', {
    id: `visit:${params.leadId}`,
    typeKey: VISIT_REMINDER_TYPE,
    title: `Завтра в ${params.timeText} — ${params.name}, ${params.service}`,
    text: 'Позвоните клиенту и подтвердите визит. Телефон есть на странице заявок.',
  })
}
