import Leads from '../tables/leads.table'
import { notifyStaffAboutNewLead } from '../server/leads-notify'
import { getSalonSettings } from '../server/salon-settings'
import { checkSlot } from '../server/slots'
import { scheduleVisitReminder } from '../jobs/visit-reminder'

/**
 * Инструмент агента: сохраняет заявку клиента в таблицу «Заявки».
 * Перед сохранением ещё раз проверяет, что выбранное время свободно.
 */
export const saveLeadTool = app
  .function('/')
  .meta({
    name: 'save-lead',
    description: 'Сохраняет заявку клиента (услуга, дата и время, имя, телефон) в список заявок',
    llmDescription:
      'Вызывай, когда собраны услуга, желаемая дата и время, имя и телефон клиента. Поля: ' +
      'name — имя клиента, phone — телефон клиента, service — услуга (категория и уточнение, ' +
      'например «Консультация, первичная»), date — дата визита в формате ГГГГ-ММ-ДД, time — время ' +
      'визита в формате ЧЧ:ММ, visitAt — желаемая дата и время словами клиента, comment — ' +
      'дополнительные пожелания. Инструмент сам проверит, свободно ли время: если занято или ' +
      'не подходит, заявка не сохранится — предложи клиенту варианты из ответа и вызови ' +
      'инструмент снова с новым временем.',
  })
  .body(s =>
    s.object(
      {
        context: s.object(
          {
            chainId: s.string().optional(),
            userId: s.string().optional(),
          },
          { additionalProperties: true },
        ),
        input: s.object(
          {
            name: s.string().describe('Имя клиента'),
            phone: s.string().describe('Телефон клиента'),
            service: s.string().describe('Какая услуга нужна клиенту — с уточнением, если оно было'),
            date: s.string().optional().describe('Дата визита в формате ГГГГ-ММ-ДД'),
            time: s.string().optional().describe('Время визита в формате ЧЧ:ММ, например 14:00'),
            visitAt: s.string().optional().describe('Желаемая дата и время визита, как их назвал клиент'),
            comment: s.string().optional().describe('Дополнительные пожелания клиента'),
          },
          { additionalProperties: true },
        ),
      },
      { additionalProperties: true },
    ),
  )
  .handle(async (ctx, body) => {
    const chainId = body.context.chainId
    ctx.account.log('saveLeadTool', { json: { chainId } })

    try {
      // Повторный вызов в том же диалоге обновляет заявку, а не создаёт вторую.
      const existing = chainId ? await Leads.findOneBy(ctx, { chainId }) : null

      const settings = await getSalonSettings(ctx)
      let visitStart: Date | undefined
      if (body.input.date && body.input.time) {
        const check = await checkSlot(
          ctx,
          settings,
          body.input.date,
          body.input.time,
          existing?.id,
        )

        if (check.status !== 'free') {
          return {
            ok: false,
            result:
              `Заявка пока НЕ сохранена. ${check.message} ` +
              'Предложи клиенту эти варианты, дождись выбора и вызови инструмент снова.',
          }
        }

        visitStart = check.start ?? undefined
      }

      const fields = {
        name: body.input.name,
        phone: body.input.phone,
        service: body.input.service,
        visitAt: body.input.visitAt,
        visitStart,
        comment: body.input.comment,
      }

      if (existing) {
        const updated = await Leads.update(ctx, { id: existing.id, ...fields })
        await scheduleVisitReminder(ctx, settings, updated)
        return { ok: true, result: `Заявка обновлена, номер ${updated.id}` }
      }

      const lead = await Leads.create(ctx, { ...fields, status: 'new', chainId })
      await notifyStaffAboutNewLead(ctx, lead)
      await scheduleVisitReminder(ctx, settings, lead)

      return { ok: true, result: `Заявка сохранена, номер ${lead.id}` }
    } catch (err: unknown) {
      return {
        ok: false,
        result: err instanceof Error ? err.message : 'Не удалось сохранить заявку',
      }
    }
  })
