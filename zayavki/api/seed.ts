import { requireAccountRole } from '@app/auth'
import Leads from '../tables/leads.table'
import Prices from '../tables/prices.table'
import { addPrice, listPrices, type PriceItem } from '../server/prices'
import { getSalonSettings } from '../server/salon-settings'
import { addDays, instantToWall, wallToInstant } from '../server/slots'

/**
 * Демо-прайс шаблона: нейтральный набор услуг сервисной компании — без отраслевых названий,
 * чтобы было видно, что плагин подходит любому бизнесу с записью и прайсом.
 * Среди услуг есть похожие пары — на них видно, как агент уточняет детали по прайсу.
 */
const DEMO_SERVICES: Array<{ title: string; price: number }> = [
  { title: 'Консультация специалиста', price: 1500 },
  { title: 'Расширенная консультация', price: 3500 },
  { title: 'Онлайн-консультация', price: 1000 },
  { title: 'Диагностика', price: 2500 },
  { title: 'Базовый ремонт', price: 4500 },
  { title: 'Срочный ремонт', price: 6500 },
  { title: 'Настройка оборудования', price: 3000 },
  { title: 'Выезд специалиста', price: 2000 },
]

/** Демо-заявки: три штуки в разных статусах, чтобы страница заявок не была пустой. */
const DEMO_LEADS: Array<{
  name: string
  phone: string
  service: string
  visitAt: string
  inDays: number
  time: string
  status: 'new' | 'in_progress' | 'done'
}> = [
  {
    name: 'Анна',
    phone: '+7 900 000-00-01',
    service: 'Диагностика',
    visitAt: 'завтра в 15:00',
    inDays: 1,
    time: '15:00',
    status: 'new',
  },
  {
    name: 'Марина',
    phone: '+7 900 000-00-02',
    service: 'Настройка оборудования',
    visitAt: 'через три дня в 12:00',
    inDays: 3,
    time: '12:00',
    status: 'in_progress',
  },
  {
    name: 'Ольга',
    phone: '+7 900 000-00-03',
    service: 'Базовый ремонт',
    visitAt: 'два дня назад в 18:00',
    inDays: -2,
    time: '18:00',
    status: 'done',
  },
]

async function clearDemoData(ctx: app.Ctx): Promise<void> {
  const [prices, leads] = await Promise.all([
    Prices.findAll(ctx, { limit: 500 }),
    Leads.findAll(ctx, { limit: 500 }),
  ])
  for (const row of prices) await Prices.delete(ctx, row.id)
  for (const row of leads) await Leads.delete(ctx, row.id)
}

/** Демонстрационный момент времени: сдвиг по календарным дням от «сегодня». */
function demoInstant(
  settings: Awaited<ReturnType<typeof getSalonSettings>>,
  inDays: number,
  time: string,
): Date {
  const now = instantToWall(settings, new Date())
  const day = addDays(now.y, now.m, now.d, inDays)
  const [hours, minutes] = time.split(':')
  return wallToInstant(settings, day.y, day.m, day.d, Number(hours ?? 0), Number(minutes ?? 0))
}

/**
 * Демо-данные шаблона: прайс и несколько заявок в разных статусах.
 * `?reset=1` — убрать демо-данные. Доступно только сотрудникам аккаунта.
 */
export const seedRoute = app
  .post('/')
  .query(s => ({ reset: s.string().optional() }))
  .handle(async (ctx, req) => {
    requireAccountRole(ctx, 'Staff')

    if (req.query.reset === '1') {
      await clearDemoData(ctx)
      return { success: true, reset: true, addedPrices: 0, addedLeads: 0, items: [] as PriceItem[] }
    }

    const settings = await getSalonSettings(ctx)
    const existing = await listPrices(ctx)
    const titles = new Set(existing.map(item => item.title.trim().toLowerCase()))

    let addedPrices = 0
    for (const service of DEMO_SERVICES) {
      if (titles.has(service.title.toLowerCase())) continue
      await addPrice(ctx, service.title, service.price)
      addedPrices += 1
    }

    // Заявки добавляем только в пустую таблицу: чужой работы не трогаем.
    const existingLeads = await Leads.findAll(ctx, { limit: 1 })
    let addedLeads = 0
    if (!existingLeads.length) {
      for (const lead of DEMO_LEADS) {
        await Leads.create(ctx, {
          name: lead.name,
          phone: lead.phone,
          service: lead.service,
          visitAt: lead.visitAt,
          visitStart: demoInstant(settings, lead.inDays, lead.time),
          comment: 'Демо-заявка из примера — можно удалить',
          status: lead.status,
        })
        addedLeads += 1
      }
    }

    return { success: true, reset: false, addedPrices, addedLeads, items: await listPrices(ctx) }
  })
