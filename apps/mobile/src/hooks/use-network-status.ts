import * as Network from "expo-network"
import { useEffect, useState } from "react"

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    let mounted = true

    void Network.getNetworkStateAsync().then((state) => {
      if (mounted) setIsOffline(state.isInternetReachable === false)
    })

    const sub = Network.addNetworkStateListener((state) => {
      setIsOffline(state.isInternetReachable === false)
    })

    return () => {
      mounted = false
      sub.remove()
    }
  }, [])

  return { isOffline }
}
