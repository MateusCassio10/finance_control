// Esta função deve ser carregada no Supabase Edge Functions
// Comando: supabase functions deploy parse-transaction

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const { input, userId } = await req.json()
    
    // 1. Chamar Gemini AI (O Backend agora é a Edge Function!)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analise o texto e retorne JSON: {type: 'expense'|'income', amount: number, description: string, category: string}. Texto: "${input}"`
          }]
        }]
      })
    })
    
    const aiResult = await response.json()
    const parsed = JSON.parse(aiResult.candidates[0].content.parts[0].text)

    // 2. Salvar no Banco de Dados
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        category: parsed.category
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
