import { requireAccountRole } from '@app/auth'
import { getSalonSettings, saveSalonSettings } from '../../server/salon-settings'

/** Сохранение логотипа: хеш файла из хранилища. Пустая строка — убрать логотип. */
export const settingsLogoRoute = app
  .post('/')
  .body(s => ({ logoHash: s.string() }))
  .handle(async (ctx, req) => {
    requireAccountRole(ctx, 'Staff')

    const logoHash = req.body.logoHash.trim()
    if (logoHash && !/^[\w.-]+$/.test(logoHash)) {
      return { success: false, error: 'Некорректный хеш файла' }
    }

    const current = await getSalonSettings(ctx)
    await saveSalonSettings(ctx, { ...current, logoHash })

    return { success: true, logoHash }
  })
