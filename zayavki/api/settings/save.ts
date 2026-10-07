import { requireAccountRole } from '@app/auth'
import { getSalonSettings, parseTimeOfDay, saveSalonSettings } from '../../server/salon-settings'

/** Сохранение настроек записи: рабочие часы, выходные, длительность окна. */
export const settingsSaveRoute = app
  .post('/')
  .body(s => ({
    salonName: s.string(),
    workdayStart: s.string(),
    workdayEnd: s.string(),
    slotMinutes: s.number().int().min(15).max(480),
    daysOff: s.array(s.number().int().min(0).max(6)),
    reminderHour: s.string(),
  }))
  .handle(async (ctx, req) => {
    requireAccountRole(ctx, 'Staff')

    const start = parseTimeOfDay(req.body.workdayStart)
    const end = parseTimeOfDay(req.body.workdayEnd)
    // Пустое название разрешено: тогда помощник представляется нейтрально.
    const salonName = req.body.salonName.trim()

    if (start === null || end === null) {
      return { success: false, error: 'Время нужно указать в формате ЧЧ:ММ, например 10:00' }
    }
    if (end - start < req.body.slotMinutes) {
      return { success: false, error: 'Рабочий день короче одного окна записи' }
    }
    if (parseTimeOfDay(req.body.reminderHour) === null) {
      return { success: false, error: 'Время напоминания нужно указать в формате ЧЧ:ММ' }
    }

    const current = await getSalonSettings(ctx)
    const settings = await saveSalonSettings(ctx, {
      salonName,
      logoHash: current.logoHash,
      workdayStart: req.body.workdayStart.trim(),
      workdayEnd: req.body.workdayEnd.trim(),
      slotMinutes: req.body.slotMinutes,
      daysOff: [...new Set(req.body.daysOff)].sort((a, b) => a - b),
      reminderHour: req.body.reminderHour.trim(),
      timeZone: current.timeZone,
    })

    return { success: true, settings }
  })
