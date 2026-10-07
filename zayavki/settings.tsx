import { jsx } from '@app/html-jsx'
import { Styles } from './styles'
import { getSalonSettings } from './server/salon-settings'
import { listPrices } from './server/prices'
import { leadsPageRoute } from './leads'
import SettingsPage from './components/SettingsPage.vue'

/** Страница «Настройки записи» — рабочие часы, выходные и прайс. Доступна сотрудникам. */
export const settingsPageRoute = app.get('/', async ctx => {
  if (!ctx.user?.is('Staff')) {
    const back = encodeURIComponent(settingsPageRoute.path())
    return ctx.resp.redirect(`/s/auth/signin?back=${back}`)
  }

  const settings = await getSalonSettings(ctx)
  const prices = await listPrices(ctx)

  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Настройки записи</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Styles />
      </head>
      <body>
        <SettingsPage settings={settings} prices={prices} leadsUrl={leadsPageRoute.path()} />
      </body>
    </html>
  )
})
