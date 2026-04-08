// Comando: supabase functions deploy notify-partner

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { message } = await req.json()
  
  // Aqui você integraria com o Firebase Cloud Messaging ou Web Push
  // O Supabase chamaria o endpoint de push salvo no banco
  
  console.log(`Enviando notificação: ${message}`)
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
