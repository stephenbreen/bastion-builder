export type LogEntryType =
  | 'bastion-order'
  | 'xanathar-activity'
  | 'project-roll'
  | 'domain-action'
  | 'bastion-event'
  | 'intrigue-turn'
  | 'construction'
  | 'system'

export interface LogEntry {
  id: string
  week: number
  actor?: string
  type: LogEntryType
  payload?: Record<string, unknown>
  outcome: string
}
