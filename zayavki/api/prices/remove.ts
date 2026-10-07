import { requireAccountRole } from '@app/auth'
import { listPrices, removePrice } from '../../server/prices'

/** Удаление услуги из прайса. */
export const priceRemoveRoute = app
  .post('/')
  .query(s => ({ id: s.string() }))
  .handle(async (ctx, req) => {
    requireAccountRole(ctx, 'Staff')

    await removePrice(ctx, req.query.id)

    return { success: true, items: await listPrices(ctx) }
  })
