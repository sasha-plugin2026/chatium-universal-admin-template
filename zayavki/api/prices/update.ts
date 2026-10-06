import { requireAccountRole } from '@app/auth'
import { listPrices, updatePrice } from '../../server/prices'

/** Изменение услуги в прайсе: название и цена. */
export const priceUpdateRoute = app
  .post('/')
  .query(s => ({ id: s.string() }))
  .body(s => ({
    title: s.string().min(1),
    price: s.number().min(0).max(10000000),
  }))
  .handle(async (ctx, req) => {
    requireAccountRole(ctx, 'Staff')

    const title = req.body.title.trim()
    if (!title) {
      return { success: false, error: 'Укажите название услуги' }
    }

    const items = await listPrices(ctx)
    const duplicate = items.some(
      item => item.id !== req.query.id && item.title.trim().toLowerCase() === title.toLowerCase(),
    )
    if (duplicate) {
      return { success: false, error: 'Такая услуга уже есть в прайсе' }
    }

    const updated = await updatePrice(ctx, req.query.id, title, req.body.price)
    if (!updated) {
      return { success: false, error: 'Услуга не найдена — возможно, её уже удалили' }
    }

    return { success: true, items: await listPrices(ctx) }
  })
