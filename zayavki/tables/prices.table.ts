import { Heap } from '@app/heap'

/** Прайс салона: услуги и цены. Владелец ведёт список сам, количество не ограничено. */
const Prices = Heap.Table(
  't_salon_prices_H3K7M1',
  {
    title: Heap.String({ customMeta: { title: 'Услуга' } }),
    price: Heap.Money({ customMeta: { title: 'Цена' } }),
  },
  {
    customMeta: {
      title: 'Прайс',
      description: 'Услуги и цены салона — помощник берёт цены только отсюда',
    },
  },
)

export default Prices
