'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Sparkles, 
  LogOut, Settings, Calendar, CreditCard, ArrowUpRight 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [balance, setBalance] = useState(0)
  const [input, setInput] = useState('')
  const [isAiProcessing, setIsAiProcessing] = useState(false)

  useEffect(() => {
    if (user) fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (data) setTransactions(data)
    
    // Cálculo simples de saldo (exemplo)
    const total = data?.reduce((acc, curr) => 
      curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0) || 0
    setBalance(total)
    setLoading(false)
  }

  const handleAiInput = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsAiProcessing(true)
    try {
      // Chama a Edge Function do Supabase (Segura)
      const { data, error } = await supabase.functions.invoke('parse-transaction', {
        body: { input, userId: user?.id }
      })

      if (error) throw error

      // Atualiza o dashboard
      setInput('')
      fetchDashboardData()
      
      // Enviar notificação push para o parceiro (via Edge Function)
      await supabase.functions.invoke('notify-partner', {
        body: { message: `Seu parceiro(a) registrou: ${data.description}` }
      })

    } catch (err) {
      console.error('Erro na IA:', err)
      alert('A IA está em manutenção ou chaves não configuradas no Supabase.')
    } finally {
      setIsAiProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 text-white pb-20">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 bg-surface-950/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-none">Bucks Flow</h2>
            <p className="text-[10px] text-surface-500 uppercase tracking-widest mt-1">Status: Online</p>
          </div>
        </div>
        <button onClick={signOut} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <LogOut className="w-5 h-5 text-surface-400" />
        </button>
      </header>

      <main className="p-6 max-w-2xl mx-auto space-y-8">
        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 bg-gradient-to-br from-brand-500/20 to-transparent relative overflow-hidden group"
        >
          <div className="relative z-10">
            <p className="text-surface-400 text-sm font-medium">Saldo Total</p>
            <h3 className="text-4xl font-bold mt-2 tracking-tight">
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex gap-4 mt-6">
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full text-xs font-semibold">
                <TrendingUp className="w-3 h-3" /> +12% esse mês
              </div>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-brand-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
        </motion.div>

        {/* AI Input Field */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-surface-500 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-brand-500" /> Assistente IA
          </h4>
          <form onSubmit={handleAiInput} className="relative group">
            <input
              type="text"
              placeholder="Ex: Paguei 50 reais no almoco hoje"
              className="w-full bg-surface-900/50 border border-white/5 rounded-3xl pl-6 pr-14 py-5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 transition-all text-sm placeholder:text-surface-600"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isAiProcessing}
            />
            <button 
              type="submit"
              disabled={isAiProcessing || !input}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center hover:bg-brand-600 transition-colors disabled:opacity-30"
            >
              {isAiProcessing ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
            </button>
          </form>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-bold text-surface-500 uppercase tracking-widest">Atividade Recente</h4>
            <button className="text-[10px] text-brand-500 font-bold uppercase hover:underline">Ver Todas</button>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {transactions.map((tx, idx) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{tx.description}</p>
                      <p className="text-[10px] text-surface-500 mt-0.5">{tx.category} • {new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>

            {transactions.length === 0 && !loading && (
              <div className="text-center py-12 glass-card border-dashed">
                <p className="text-surface-500 text-sm">Nenhuma transação encontrada.<br/>Use a IA para registrar seu primeiro gasto!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 p-4 bg-surface-950/80 backdrop-blur-2xl border-t border-white/5 flex justify-around items-center z-50">
        <button className="p-3 text-brand-500 flex flex-col items-center gap-1">
          <Wallet className="w-6 h-6" />
          <span className="text-[8px] font-bold uppercase">Carteira</span>
        </button>
        <button className="p-3 text-surface-500 flex flex-col items-center gap-1 hover:text-brand-500 transition-colors">
          <Calendar className="w-6 h-6" />
          <span className="text-[8px] font-bold uppercase">Agenda</span>
        </button>
        <button className="p-3 text-surface-500 flex flex-col items-center gap-1 hover:text-brand-500 transition-colors">
          <Settings className="w-6 h-6" />
          <span className="text-[8px] font-bold uppercase">Ajustes</span>
        </button>
      </nav>
    </div>
  )
}
