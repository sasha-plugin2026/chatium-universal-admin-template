import { requireAccountRole } from '@app/auth'
import { addPrice, listPrices, matchPrices } from '../../server/prices'

/** Добавление услуги в прайс салона. */
export const priceAddRoute = app
  .post('/')
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
    const duplicate = matchPrices(items, title).some(
      match => match.item.title.trim().toLowerCase() === title.toLowerCase(),
    )
    if (duplicate) {
      return { success: false, error: 'Такая услуга уже есть в прайсе' }
    }

    await addPrice(ctx, title, req.body.price)

    return { success: true, items: await listPrices(ctx) }
  })
