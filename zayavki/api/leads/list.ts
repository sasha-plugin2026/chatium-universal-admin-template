import { requireAccountRole } from '@app/auth'
import Leads from '../../tables/leads.table'
import { getSalonSettings } from '../../server/salon-settings'
import { formatSlotShort } from '../../server/slots'

/** Список заявок для сотрудников аккаунта. */
export const leadsListRoute = app.get('/', async ctx => {
  requireAccountRole(ctx, 'Staff')

  const settings = await getSalonSettings(ctx)
  const rows = await Leads.findAll(ctx, {
    limit: 200,
    order: [{ createdAt: 'desc' }, { id: 'asc' }],
  })

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    service: row.service,
    visitAt: row.visitAt ?? '',
    visitStartText: row.visitStart ? formatSlotShort(settings, row.visitStart) : '',
    comment: row.comment ?? '',
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }))
})
