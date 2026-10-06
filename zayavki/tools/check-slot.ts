import { getSalonSettings } from '../server/salon-settings'
import { checkSlot } from '../server/slots'

/**
 * Инструмент агента: проверяет, свободно ли названное клиентом время,
 * и подсказывает ближайшие свободные окна.
 */
export const checkSlotTool = app
  .function('/')
  .meta({
    name: 'check-slot',
    description: 'Проверяет, свободно ли время визита, и предлагает ближайшие свободные окна',
    llmDescription:
      'Вызывай сразу, как только клиент назвал желаемую дату и время визита, и до того, как ' +
      'подтверждать запись. Поля: date — дата в формате ГГГГ-ММ-ДД, time — время в формате ЧЧ:ММ ' +
      '(24 часа). Например, для «в четверг в 14:00» при сегодняшней дате 2026-10-05 нужно передать ' +
      'date «2026-10-08» и time «14:00». В ответе будет либо «СВОБОДНО», либо причина (' +
      '«ЗАНЯТО», «ВЫХОДНОЙ», «ВНЕ РАБОЧИХ ЧАСОВ», «ЭТО ВРЕМЯ УЖЕ ПРОШЛО») и список ближайших ' +
      'свободных окон. Если время занято или не подходит, предложи клиенту варианты из ответа ' +
      'и дождись его выбора.',
  })
  .body(s =>
    s.object(
      {
        context: s.object({ chainId: s.string().optional() }, { additionalProperties: true }),
        input: s.object(
          {
            date: s.string().describe('Дата визита в формате ГГГГ-ММ-ДД'),
            time: s.string().describe('Время визита в формате ЧЧ:ММ, например 14:00'),
          },
          { additionalProperties: true },
        ),
      },
      { additionalProperties: true },
    ),
  )
  .handle(async (ctx, body) => {
    try {
      const settings = await getSalonSettings(ctx)
      const result = await checkSlot(ctx, settings, body.input.date, body.input.time)

      return { ok: true, result: result.message, status: result.status }
    } catch (err: unknown) {
      return {
        ok: false,
        result: err instanceof Error ? err.message : 'Не удалось проверить окно',
      }
    }
  })
