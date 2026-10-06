import { requireAccountRole } from '@app/auth'
import Leads from '../../tables/leads.table'

/** Смена статуса заявки: «Новая» → «В работе» → «Готово». */
export const leadStatusRoute = app
  .post('/')
  .query(s => ({ id: s.string() }))
  .body(s => ({ status: s.enum(['new', 'in_progress', 'done'] as const) }))
  .handle(async (ctx, req) => {
    requireAccountRole(ctx, 'Staff')

    const lead = await Leads.update(ctx, { id: req.query.id, status: req.body.status })

    return { id: lead.id, status: lead.status }
  })
