// Enhanced offline detection for local network PWAs
// This handles the specific case where PWA is installed from local network IP

export interface OfflineStatus {
  isOffline: boolean
  isLocalNetwork: boolean
  lastOnlineTime: number | null
  connectionType: 'wifi' | 'cellular' | 'unknown'
}

class OfflineDetectionManager {
  private isOffline = false
  private isLocalNetwork = false
  private lastOnlineTime: number | null = null
  private connectionType: 'wifi' | 'cellular' | 'unknown' = 'unknown'
  private listeners: ((status: OfflineStatus) => void)[] = []
  private checkInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initialize()
  }

  private initialize() {
    if (typeof window === 'undefined') return

    // Check if we're on a local network
    this.isLocalNetwork = this.checkIfLocalNetwork()
    
    // Set initial offline status
    this.isOffline = !navigator.onLine
    this.lastOnlineTime = this.isOffline ? null : Date.now()

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    // For local network PWAs, we need more aggressive checking
    if (this.isLocalNetwork) {
      this.startConnectionMonitoring()
    }

    // Detect connection type if available
    this.detectConnectionType()
  }

  private checkIfLocalNetwork(): boolean {
    if (typeof window === 'undefined') return false
    
    const hostname = window.location.hostname
    return (
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1'
    )
  }

  private detectConnectionType() {
    if (typeof window === 'undefined') return

    // Try to detect connection type using various methods
    const connection = navigator.connection || 
                     navigator.mozConnection || 
                     navigator.webkitConnection

    if (connection) {
      if (connection.type === 'wifi' || connection.effectiveType === '4g') {
        this.connectionType = 'wifi'
      } else if (connection.type === 'cellular') {
        this.connectionType = 'cellular'
      }
    }

    // Fallback: check if we're on local network (likely WiFi)
    if (this.isLocalNetwork) {
      this.connectionType = 'wifi'
    }
  }

  private startConnectionMonitoring() {
    // For local network PWAs, check connection more frequently
    this.checkInterval = setInterval(async () => {
      await this.checkConnection()
    }, 2000) // Check every 2 seconds
  }

  private async checkConnection(): Promise<void> {
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch(`${window.location.origin}/manifest.json`, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })

      if (response.ok && this.isOffline) {
        this.handleOnline()
      }
    } catch {
      if (!this.isOffline) {
        this.handleOffline()
      }
    }
  }

  private handleOnline() {
    console.log('🌐 Connection restored')
    this.isOffline = false
    this.lastOnlineTime = Date.now()
    this.notifyListeners()
  }

  private handleOffline() {
    console.log('📱 Connection lost')
    this.isOffline = true
    this.notifyListeners()
  }

  private notifyListeners() {
    const status: OfflineStatus = {
      isOffline: this.isOffline,
      isLocalNetwork: this.isLocalNetwork,
      lastOnlineTime: this.lastOnlineTime,
      connectionType: this.connectionType
    }

    this.listeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        console.error('Error in offline status listener:', error)
      }
    })
  }

  public getStatus(): OfflineStatus {
    return {
      isOffline: this.isOffline,
      isLocalNetwork: this.isLocalNetwork,
      lastOnlineTime: this.lastOnlineTime,
      connectionType: this.connectionType
    }
  }

  public addListener(listener: (status: OfflineStatus) => void) {
    this.listeners.push(listener)
    // Immediately call with current status
    listener(this.getStatus())
  }

  public removeListener(listener: (status: OfflineStatus) => void) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this))
      window.removeEventListener('offline', this.handleOffline.bind(this))
    }
  }
}

// Create singleton instance
export const offlineDetection = new OfflineDetectionManager()

// Export convenience functions
export function useOfflineDetection() {
  return offlineDetection
}

export function isOffline(): boolean {
  return offlineDetection.getStatus().isOffline
}

export function isLocalNetwork(): boolean {
  return offlineDetection.getStatus().isLocalNetwork
}
