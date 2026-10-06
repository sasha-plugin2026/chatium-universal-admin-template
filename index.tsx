import { zayavkiChatPageRoute } from './zayavki/index'

/** Корень сайта: сразу открываем чат приёма заявок. */
export const homePageRoute = app.get('/', async ctx => ctx.resp.redirect(zayavkiChatPageRoute.url()))
