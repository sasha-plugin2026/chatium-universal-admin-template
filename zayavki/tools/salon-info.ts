import { listPrices } from '../server/prices'
import { getSalonSettings } from '../server/salon-settings'
import { describeSchedule } from '../server/slots'

/** Больше этого числа услуг в ответ не вмещаем — контекст модели не резиновый. */
const MAX_SERVICES = 40

/**
 * Инструмент агента: отдаёт актуальное название салона, часы работы
 * и список услуг из прайса. Всё меняется в настройках — промпт править не нужно.
 */
export const salonInfoTool = app
  .function('/')
  .meta({
    name: 'salon-info',
    description: 'Возвращает название салона, часы работы и список услуг из прайса',
    llmDescription:
      'Вызывай один раз в начале диалога, до приветствия: в ответе — как называется салон, как он ' +
      'работает и какие услуги сейчас есть в прайсе с ценами. Предлагай клиенту только услуги из ' +
      'этого списка: если услугу добавили в прайс, она появится в списке, если убрали — исчезнет. ' +
      'Вызывай инструмент снова, если клиент спрашивает про название салона, часы работы или ' +
      'какие услуги есть. Входные поля не нужны — передай пустой объект input.',
  })
  .body(s =>
    s.object(
      {
        context: s.object({ chainId: s.string().optional() }, { additionalProperties: true }),
        input: s.object({}, { additionalProperties: true }),
      },
      { additionalProperties: true },
    ),
  )
  .handle(async ctx => {
    try {
      const settings = await getSalonSettings(ctx)
      const prices = await listPrices(ctx)
      const name = settings.salonName.trim()
      const schedule = describeSchedule(settings)

      const shown = prices.slice(0, MAX_SERVICES)
      const services = shown.length
        ? `Услуги из прайса салона (${prices.length}): ${shown
            .map(item => `${item.title} — ${item.priceText}`)
            .join('; ')}.${prices.length > shown.length ? ' Есть и другие услуги.' : ''}`
        : 'В прайсе салона пока нет ни одной услуги: предлагать клиенту нечего, скажи, что уточнит администратор.'

      const about = name
        ? `Название салона: «${name}». Представляйся клиенту этим названием.`
        : 'Название салона в настройках не задано. Представляйся нейтрально: «наш салон».'

      return { ok: true, result: `${about} ${schedule} ${services}` }
    } catch (err: unknown) {
      return {
        ok: false,
        result: err instanceof Error ? err.message : 'Не удалось прочитать настройки салона',
      }
    }
  })
