import { listPrices, matchPrices, EXACT_SCORE, PRECISE_SCORE } from '../server/prices'

/** Похоже, клиент просит показать цены вообще, а не спрашивает про конкретную услугу. */
const LIST_INTENT = /(цен|прайс|стоимост|сколько стоят услуг|перечень услуг)/i

/**
 * Инструмент агента: ищет цену услуги в прайсе салона.
 * Если услуги в прайсе нет, агент должен сказать, что цену уточнит администратор.
 */
export const getPriceTool = app
  .function('/')
  .meta({
    name: 'get-price',
    description: 'Ищет цену услуги в прайсе салона',
    llmDescription:
      'Вызывай, когда клиент спрашивает про цену или стоимость услуги. Поле service — название ' +
      'услуги словами клиента, например «маникюр с покрытием». Если клиент просто спрашивает ' +
      '«какие у вас цены» — передай пустую строку, и инструмент вернёт весь прайс. В ответе будут ' +
      'только цены из прайса салона: называй клиенту ровно их. Если нужной услуги в ответе нет ' +
      '(«В ПРАЙСЕ НЕТ»), не придумывай цену — скажи, что стоимость уточнит администратор.',
  })
  .body(s =>
    s.object(
      {
        context: s.object({ chainId: s.string().optional() }, { additionalProperties: true }),
        input: s.object(
          {
            service: s.string().describe('Название услуги словами клиента; пустая строка — показать весь прайс'),
          },
          { additionalProperties: true },
        ),
      },
      { additionalProperties: true },
    ),
  )
  .handle(async (ctx, body) => {
    try {
      const items = await listPrices(ctx)

      if (!items.length) {
        return {
          ok: true,
          result:
            'ПРАЙС ПУСТ: цены пока не заполнены. Скажи клиенту, что стоимость уточнит администратор.',
        }
      }

      const query = (body.input.service ?? '').trim()
      const wantsWholeList = !query || LIST_INTENT.test(query)

      // Без запроса или с просьбой «покажите цены» показываем весь прайс.
      const all = items.map(item => ({ item, score: 0 }))
      const matches = wantsWholeList ? all : matchPrices(items, query)

      if (!matches.length) {
        return {
          ok: true,
          result:
            `В ПРАЙСЕ НЕТ услуги «${query}». Не называй цену сам — скажи клиенту, что стоимость ` +
            'уточнит администратор, и предложи оставить заявку.',
        }
      }

      // Точное совпадение — самый точный ответ, лишнее не подмешиваем.
      // Иначе показываем близкие совпадения, а если и их нет — всё, что похоже по словам.
      const exact = matches.filter(match => match.score >= EXACT_SCORE)
      const precise = matches.filter(match => match.score >= PRECISE_SCORE)
      const best = exact.length ? exact : precise.length ? precise : matches
      const limit = exact.length ? 3 : 5
      const shown = best.slice(0, limit)
      const lines = shown.map(match => `${match.item.title} — ${match.item.priceText}`)
      const tail = best.length > shown.length ? ' Есть и другие услуги в прайсе.' : ''

      return {
        ok: true,
        result: `Цены из прайса салона: ${lines.join('; ')}.${tail}`,
      }
    } catch (err: unknown) {
      return {
        ok: false,
        result: err instanceof Error ? err.message : 'Не удалось посмотреть прайс',
      }
    }
  })
