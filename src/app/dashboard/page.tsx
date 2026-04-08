'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Sparkles, 
  LogOut, Settings, Calendar, CreditCard, ArrowUpRight, ArrowDownRight,
  User as UserIcon, Bell, Heart, Copy, UserPlus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [balance, setBalance] = useState(0)
  const [input, setInput] = useState('')
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [household, setHousehold] = useState<any>(null)
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      fetchHousehold()
    }
  }, [user])

  const fetchHousehold = async () => {
    const { data } = await supabase
      .from('households')
      .select('*')
      .single()
    
    if (data) {
      setHousehold(data)
    } else {
      setInviteCode(user?.id.slice(0, 8).toUpperCase() || '')
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (data) {
      setTransactions(data)
      const total = data.reduce((acc, curr) => 
        curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0)
      setBalance(total)
    }
    setLoading(false)
  }

  const handleAiInput = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isAiProcessing) return

    setIsAiProcessing(true)
    try {
      const { data, error } = await supabase.functions.invoke('parse-transaction', {
        body: { 
          input, 
          userId: user?.id,
          householdId: household?.id 
        }
      })

      if (error) throw error
      setInput('')
      await fetchDashboardData()
      
      // Notificar parceiro automaticamente
      if (household) {
        await supabase.functions.invoke('notify-partner', {
          body: { 
            message: `${user?.user_metadata?.name || 'Seu parceiro'} registrou: ${data.description}`,
            householdId: household.id 
          }
        })
      }
    } catch (err) {
      console.error('IA Error:', err)
    } finally {
      setIsAiProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-green-500/30">
      {/* Header */}
      <header className="px-6 py-8 flex justify-between items-center max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
            <UserIcon className="w-6 h-6 text-zinc-400" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Bem-vindo</p>
            <h2 className="font-bold text-xl">{user?.user_metadata?.name || 'Usuário'}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5 text-zinc-400" />
          </button>
          <button onClick={signOut} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 hover:bg-red-500/10 group transition-colors">
            <LogOut className="w-5 h-5 text-zinc-400 group-hover:text-red-400" />
          </button>
        </div>
      </header>

      <main className="px-6 max-w-2xl mx-auto pb-32 space-y-10">
        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 bg-gradient-to-br from-green-500/10 via-transparent to-transparent relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col items-center text-center">
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-3">Saldo Disponível</p>
            <h3 className="text-5xl font-black tracking-tight">
              <span className="text-zinc-600 mr-2 text-2xl font-bold">R$</span>
              {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <div className="mt-8 flex gap-3">
              <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider border border-green-500/10">
                +12% este mês
              </div>
            </div>
          </div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/5 rounded-full blur-[100px]" />
        </motion.div>

        {/* Couple / Household Section */}
        {!household && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#121212] border border-pink-500/10 p-6 rounded-[2rem] space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Conectar Parceiro(a)</h4>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Controle financeiro a dois</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 flex items-center justify-between">
                <span className="font-mono text-sm tracking-widest text-zinc-400">{inviteCode}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode)
                    alert('Código copiado!')
                  }}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
              <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 rounded-2xl transition-all active:scale-95">
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[9px] text-zinc-600 text-center px-4 italic">
              Compartilhe seu código acima com seu parceiro para vincularem as contas.
            </p>
          </motion.div>
        )}

        {/* AI Input Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Sparkles className="w-4 h-4 text-green-500" />
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Bucks AI</h4>
          </div>
          <form onSubmit={handleAiInput} className="relative group">
            <input
              type="text"
              placeholder="O que você comprou hoje?"
              className="input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isAiProcessing}
            />
            <button 
              type="submit"
              disabled={isAiProcessing || !input}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center hover:bg-green-400 transition-all active:scale-90 disabled:opacity-30"
            >
              {isAiProcessing ? (
                <div className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <Plus className="w-6 h-6 text-black" />
              )}
            </button>
          </form>
        </div>

        {/* Transactions */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Atividade</h4>
            <button className="text-[10px] font-black text-green-500 uppercase tracking-widest hover:underline">Ver extrato</button>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {transactions.map((tx, idx) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#121212] border border-white/5 p-5 rounded-[2rem] flex items-center justify-between group hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                      tx.type === 'income' 
                        ? 'bg-green-500/5 border-green-500/10 text-green-500' 
                        : 'bg-zinc-900 border-white/5 text-zinc-400'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-7 h-7" /> : <ArrowDownRight className="w-7 h-7" />}
                    </div>
                    <div>
                      <p className="font-bold text-base text-zinc-100">{tx.description}</p>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                        {tx.category} • {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${tx.type === 'income' ? 'text-green-500' : 'text-zinc-100'}`}>
                      {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {transactions.length === 0 && !loading && (
              <div className="py-20 text-center glass-card border-dashed">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-zinc-700" />
                </div>
                <p className="text-zinc-500 font-bold text-sm">Sem registros ainda.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-8 left-6 right-6 max-w-md mx-auto h-20 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex justify-around items-center z-50 px-4 shadow-2xl">
        <button className="p-4 text-green-500 flex flex-col items-center gap-1 transition-all scale-110">
          <Wallet className="w-7 h-7" />
        </button>
        <button className="p-4 text-zinc-600 hover:text-white transition-all">
          <Calendar className="w-7 h-7" />
        </button>
        <button className="p-4 text-zinc-600 hover:text-white transition-all">
          <Plus className="w-7 h-7" />
        </button>
        <button className="p-4 text-zinc-600 hover:text-white transition-all">
          <TrendingUp className="w-7 h-7" />
        </button>
        <button className="p-4 text-zinc-600 hover:text-white transition-all">
          <Settings className="w-7 h-7" />
        </button>
      </nav>
    </div>
  )
}
