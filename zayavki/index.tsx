import { jsx } from '@app/html-jsx'
import { findCurrentWorkspaceAgents, findOwnPluginAgent } from '@ai-agents/sdk/process'
import { generateChatClientAgentToken } from '@start/sdk'
import { Styles } from './styles'
import { getSalonSettings } from './server/salon-settings'
import { leadsPageRoute } from './leads'
import ChatPage from './components/ChatPage.vue'

/** Ключ канала чата. Должен совпадать с transport.key в ChatWidget.vue. */
export const zayavkiTransportKey = 'zayavki-chat'

/**
 * ID агента «main» в текущем аккаунте.
 * В аккаунте-потребителе плагин резолвит своего агента через `findOwnPluginAgent`,
 * а в собственном аккаунте кода вызов идёт не от имени плагина — там остаётся
 * поиск агента воркспейса (он же работает и при локальной проверке).
 */
async function resolveMainAgentId(ctx: app.Ctx): Promise<string> {
  try {
    const own = await findOwnPluginAgent(ctx, { localId: 'main' })
    if (own?.agentId) return own.agentId
  } catch {
    // Не плагинный вызов: ищем агента воркспейса ниже.
  }

  try {
    const agents = await findCurrentWorkspaceAgents(ctx)
    return agents.find(item => item.workspaceAgentKey === 'main')?.id ?? ''
  } catch {
    return ''
  }
}

/** Страница «Оставить заявку» — её открывает клиент. */
export const zayavkiChatPageRoute = app.get('/', async ctx => {
  const agentId = await resolveMainAgentId(ctx)
  const agentToken = agentId
    ? await generateChatClientAgentToken(ctx, { agentId, transportKey: zayavkiTransportKey })
    : ''
  const settings = await getSalonSettings(ctx)

  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Оставить заявку</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Styles />
      </head>
      <body>
        <ChatPage
          agentId={agentId}
          agentToken={agentToken}
          isStaff={Boolean(ctx.user?.is('Staff'))}
          salonName={settings.salonName}
          logoHash={settings.logoHash}
          leadsUrl={leadsPageRoute.path()}
        />
      </body>
    </html>
  )
})
