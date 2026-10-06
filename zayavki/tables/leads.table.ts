import { Heap } from '@app/heap'

const Leads = Heap.Table(
  't_leads_XJ4P9D',
  {
    name: Heap.String({ customMeta: { title: 'Имя' } }),
    phone: Heap.String({ customMeta: { title: 'Телефон' } }),
    service: Heap.String({ customMeta: { title: 'Услуга' } }),
    visitAt: Heap.Optional(
      Heap.String({ customMeta: { title: 'Желаемая дата и время' } }),
    ),
    visitStart: Heap.Optional(
      Heap.DateTime({ customMeta: { title: 'Начало визита' } }),
    ),
    reminderSentAt: Heap.Optional(
      Heap.DateTime({ customMeta: { title: 'Напоминание отправлено' } }),
    ),
    reminderForStart: Heap.Optional(
      Heap.DateTime({ customMeta: { title: 'Напоминание о визите на' } }),
    ),
    comment: Heap.Optional(Heap.String({ customMeta: { title: 'Комментарий' } })),
    status: Heap.Enum(
      { fresh: 'new', inProgress: 'in_progress', done: 'done' } as const,
      { customMeta: { title: 'Статус' }, defaultValue: 'new' as const },
    ),
    chainId: Heap.Optional(Heap.String({ customMeta: { title: 'Диалог с клиентом' } })),
  },
  {
    customMeta: {
      title: 'Заявки',
      description: 'Заявки клиентов, которые собрал ИИ-агент приёма заявок',
    },
  },
)

export default Leads
