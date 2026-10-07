import { saveLeadTool } from './save-lead'
import { checkSlotTool } from './check-slot'
import { getPriceTool } from './get-price'
import { salonInfoTool } from './salon-info'

/**
 * Делает инструменты помощника доступными агентам аккаунта.
 *
 * Шаблон разворачивается как код аккаунта, поэтому инструменты регистрирует
 * `accountHook`. Если этот же код публикуется как плагин в Store (там он работает
 * как код плагина в аккаунте-потребителе), регистрацию нужно заменить на
 * `app.pluginHook('@start/agent/tools', …)`.
 */
app.accountHook('@start/agent/tools', async () => [
  saveLeadTool,
  checkSlotTool,
  getPriceTool,
  salonInfoTool,
])
