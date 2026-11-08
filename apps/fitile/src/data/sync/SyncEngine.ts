import type { FitileRepository } from '../local/repositories'
import type { SyncStatus, SyncTransport } from './types'

export class SyncEngine {
  status: SyncStatus = 'idle'

  constructor(private repository: FitileRepository, private transport: SyncTransport) {}

  async flush() {
    if (this.status === 'syncing') return
    this.status = 'syncing'
    try {
      for (const operation of await this.repository.pendingOperations()) {
        try {
          const acknowledgement = await this.transport.push(operation)
          if (acknowledgement.operationId === operation.id) await this.repository.acknowledgeOperation(operation.id)
        } catch (error) {
          if (error instanceof SyncAuthError) {
            this.status = 'auth-required'
            return
          }
          if (error instanceof TypeError) this.status = 'offline'
          else this.status = 'error'
          await this.repository.deferOperation(operation)
          return
        }
      }
      this.status = 'idle'
    } finally {
      if (this.status === 'syncing') this.status = 'idle'
    }
  }
}

export class SyncAuthError extends Error {}
