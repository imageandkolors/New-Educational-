import { prisma } from './prisma'

export interface SyncData {
  id: string
  table: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  data: any
  timestamp: Date
  synced: boolean
}

export class OfflineSyncManager {
  private static instance: OfflineSyncManager
  private syncQueue: SyncData[] = []
  private isOnline = true
  private syncInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeSync()
  }

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager()
    }
    return OfflineSyncManager.instance
  }

  private initializeSync() {
    // Check online status
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      
      window.addEventListener('online', () => {
        this.isOnline = true
        this.syncPendingChanges()
      })
      
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }

    // Start sync interval
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingChanges()
      }
    }, 30000) // Sync every 30 seconds
  }

  /**
   * Add operation to sync queue
   */
  addToQueue(operation: Omit<SyncData, 'id' | 'timestamp' | 'synced'>) {
    const syncData: SyncData = {
      id: this.generateId(),
      timestamp: new Date(),
      synced: false,
      ...operation
    }

    this.syncQueue.push(syncData)
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue))
    }

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingChanges()
    }
  }

  /**
   * Sync pending changes to server
   */
  private async syncPendingChanges() {
    const pendingChanges = this.syncQueue.filter(item => !item.synced)
    
    if (pendingChanges.length === 0) return

    try {
      for (const change of pendingChanges) {
        await this.syncSingleChange(change)
        change.synced = true
      }

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue))
      }

      // Clean up old synced items (keep last 100)
      this.syncQueue = this.syncQueue.slice(-100)
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }

  /**
   * Sync a single change
   */
  private async syncSingleChange(change: SyncData): Promise<void> {
    const token = localStorage.getItem('token')
    
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(change)
    })

    if (!response.ok) {
      throw new Error(`Sync failed for ${change.table}:${change.id}`)
    }
  }

  /**
   * Load sync queue from localStorage
   */
  loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('syncQueue')
      if (stored) {
        this.syncQueue = JSON.parse(stored)
      }
    }
  }

  /**
   * Get pending changes count
   */
  getPendingChangesCount(): number {
    return this.syncQueue.filter(item => !item.synced).length
  }

  /**
   * Force sync now
   */
  async forcSync(): Promise<boolean> {
    try {
      await this.syncPendingChanges()
      return true
    } catch (error) {
      console.error('Force sync failed:', error)
      return false
    }
  }

  /**
   * Clear sync queue
   */
  clearQueue() {
    this.syncQueue = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('syncQueue')
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      pendingChanges: this.getPendingChangesCount(),
      lastSync: this.getLastSyncTime()
    }
  }

  private getLastSyncTime(): Date | null {
    const syncedItems = this.syncQueue.filter(item => item.synced)
    if (syncedItems.length === 0) return null
    
    return new Date(Math.max(...syncedItems.map(item => item.timestamp.getTime())))
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
}

// Export singleton instance
export const syncManager = OfflineSyncManager.getInstance()