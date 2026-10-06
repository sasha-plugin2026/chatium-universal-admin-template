import { jsx } from '@app/html-jsx'
import { Styles } from './styles'
import { getSalonSettings } from './server/salon-settings'
import { zayavkiChatPageRoute } from './index'
import { settingsPageRoute } from './settings'
import LeadsPage from './components/LeadsPage.vue'

/** Страница «Заявки» — список заявок, доступен сотрудникам аккаунта. */
export const leadsPageRoute = app.get('/', async ctx => {
  // Заявки видят только сотрудники аккаунта: остальных отправляем на вход.
  if (!ctx.user?.is('Staff')) {
    const back = encodeURIComponent(leadsPageRoute.path())
    return ctx.resp.redirect(`/s/auth/signin?back=${back}`)
  }

  const settings = await getSalonSettings(ctx)

  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Заявки</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Styles />
      </head>
      <body>
        <LeadsPage
          salonName={settings.salonName}
          logoHash={settings.logoHash}
          chatUrl={zayavkiChatPageRoute.path()}
          settingsUrl={settingsPageRoute.path()}
        />
      </body>
    </html>
  )
})
