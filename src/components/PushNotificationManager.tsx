'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PushNotificationManager() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !supabase) return

    const setupPush = async () => {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const registration = await navigator.serviceWorker.ready
        let subscription = await registration.pushManager.getSubscription()

        if (!subscription) {
          // No GitHub Pages, você usaria o VAPID_PUBLIC_KEY configurado no Supabase
          const { data } = await supabase!.functions.invoke('get-vapid-key')
          
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: data.publicKey
          })
        }

        // Salvar a subscrição diretamente no banco do Supabase
        const { data: { user } } = await supabase!.auth.getUser()
        if (user) {
          await supabase!
            .from('push_subscriptions')
            .upsert({ 
              user_id: user.id, 
              subscription: subscription.toJSON(),
              updated_at: new Date().toISOString()
            })
        }

      } catch (err) {
        console.error('Push falhou:', err)
      }
    }

    // Small delay to let app load
    setTimeout(setupPush, 5000)
  }, [])

  return null
}
