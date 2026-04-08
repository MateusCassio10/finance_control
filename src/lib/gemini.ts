// No GitHub Pages, chamaremos uma Edge Function do Supabase
// para não expor a GEMINI_API_KEY no frontend.
import { supabase } from './supabase'

export const parseTransaction = async (input: string) => {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }
  
  const { data, error } = await supabase.functions.invoke('parse-transaction', {
    body: { input }
  })
  
  if (error) throw error
  return data
}
