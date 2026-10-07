import { Money } from '@app/heap'
import Prices from '../tables/prices.table'

/** Валюта прайса. */
const CURRENCY = 'RUB'

export type PriceItem = {
  id: string
  title: string
  amount: number
  priceText: string
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Сравнивает слова по началу — чтобы «консультация» находилась в «консультации
 * специалиста». Достаточно первых четырёх букв.
 */
function sameStem(a: string, b: string): boolean {
  if (a === b) return true
  const length = Math.min(a.length, b.length, 4)
  if (length < 4) return false
  return a.slice(0, 4) === b.slice(0, 4)
}

export function toPriceItem(ctx: app.Ctx, row: typeof Prices.T): PriceItem {
  return {
    id: row.id,
    title: row.title,
    amount: row.price.amount,
    priceText: row.price.format(ctx, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  }
}

/** Весь прайс по алфавиту. */
export async function listPrices(ctx: app.Ctx): Promise<PriceItem[]> {
  const rows = await Prices.findAll(ctx, {
    limit: 200,
    order: [{ title: 'asc' }, { id: 'asc' }],
  })
  return rows.map(row => toPriceItem(ctx, row))
}

export async function addPrice(ctx: app.Ctx, title: string, amount: number): Promise<void> {
  await Prices.create(ctx, {
    title: title.trim(),
    price: new Money(amount, CURRENCY),
  })
}

export async function removePrice(ctx: app.Ctx, id: string): Promise<void> {
  await Prices.delete(ctx, id)
}

/** Меняет название и цену услуги. Возвращает false, если услуги уже нет. */
export async function updatePrice(
  ctx: app.Ctx,
  id: string,
  title: string,
  amount: number,
): Promise<boolean> {
  const row = await Prices.findById(ctx, id)
  if (!row) return false

  await Prices.update(ctx, {
    id,
    title: title.trim(),
    price: new Money(amount, CURRENCY),
  })
  return true
}

export type PriceMatch = { item: PriceItem; score: number }

/**
 * Ищет услугу в прайсе по словам клиента: сначала точное совпадение,
 * потом вхождение названия в запрос (и наоборот), потом общие слова.
 */
export function matchPrices(items: PriceItem[], query: string): PriceMatch[] {
  const q = normalize(query)
  if (!q) return []

  const scored: PriceMatch[] = []

  for (const item of items) {
    const title = normalize(item.title)
    if (!title) continue

    let score = 0
    if (title === q) {
      score = 1000
    } else if (q.includes(title)) {
      // В запросе клиента целиком есть название из прайса — чем длиннее, тем точнее.
      score = 500 + title.length
    } else if (title.includes(q)) {
      score = 300 + q.length
    } else {
      const queryWords = q.split(' ').filter(word => word.length > 2)
      const titleWords = title.split(' ').filter(word => word.length > 2)
      const common = queryWords.filter(word =>
        titleWords.some(titleWord => sameStem(word, titleWord)),
      ).length
      if (common) score = 100 + common * 10
    }

    if (score) scored.push({ item, score })
  }

  scored.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
  return scored
}

/** Совпадение, которое можно считать точным ответом на вопрос клиента. */
export const PRECISE_SCORE = 300

/** Название из прайса ровно совпало с запросом клиента. */
export const EXACT_SCORE = 1000
