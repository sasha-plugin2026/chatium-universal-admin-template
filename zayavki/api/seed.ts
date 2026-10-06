import { requireAccountRole } from '@app/auth'
import Leads from '../tables/leads.table'
import Prices from '../tables/prices.table'
import { addPrice, listPrices, type PriceItem } from '../server/prices'
import { getSalonSettings } from '../server/salon-settings'
import { addDays, instantToWall, wallToInstant } from '../server/slots'

/**
 * Демо-прайс шаблона: те же типы услуг, о которых агент умеет задавать уточняющие вопросы,
 * чтобы после установки было что показать клиенту и агенту.
 */
const DEMO_SERVICES: Array<{ title: string; price: number }> = [
  { title: 'Маникюр с покрытием', price: 2500 },
  { title: 'Маникюр гигиенический', price: 1500 },
  { title: 'Педикюр с покрытием', price: 3200 },
  { title: 'Стрижка женская', price: 2500 },
  { title: 'Стрижка мужская', price: 1500 },
  { title: 'Окрашивание волос в один тон', price: 5500 },
  { title: 'Коррекция бровей', price: 1200 },
  { title: 'Окрашивание бровей', price: 1600 },
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
    service: 'Маникюр с покрытием',
    visitAt: 'завтра в 15:00',
    inDays: 1,
    time: '15:00',
    status: 'new',
  },
  {
    name: 'Марина',
    phone: '+7 900 000-00-02',
    service: 'Стрижка женская',
    visitAt: 'через три дня в 12:00',
    inDays: 3,
    time: '12:00',
    status: 'in_progress',
  },
  {
    name: 'Ольга',
    phone: '+7 900 000-00-03',
    service: 'Окрашивание волос в один тон',
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

/** Демонстрационный момент времени: сдвиг по календарным дням салона от «сегодня». */
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
          comment: 'Демо-заявка из шаблона — можно удалить',
          status: lead.status,
        })
        addedLeads += 1
      }
    }

    return { success: true, reset: false, addedPrices, addedLeads, items: await listPrices(ctx) }
  })
