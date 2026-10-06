import { saveLeadTool } from './save-lead'
import { checkSlotTool } from './check-slot'
import { getPriceTool } from './get-price'
import { salonInfoTool } from './salon-info'

// Делает инструменты агента доступными агентам аккаунта, в котором работает плагин.
app.accountHook('@start/agent/tools', async () => [
  saveLeadTool,
  checkSlotTool,
  getPriceTool,
  salonInfoTool,
])
