'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Sparkles, 
  LogOut, Settings, Calendar, CreditCard, ArrowUpRight, ArrowDownRight,
  User as UserIcon, Bell, Heart, Copy, UserPlus, Landmark, Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'overview' | 'accounts' | 'cards' | 'goals' | 'settings'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
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
    if (!supabase) return
    
    const { data } = await supabase
      .from('profiles')
      .select('*, households(*)')
      .eq('id', user?.id)
      .maybeSingle()
    
    if (data?.households) {
      setHousehold(data.households)
    } else {
      setInviteCode(user?.id.slice(0, 8).toUpperCase() || '')
    }
  }

  const fetchDashboardData = async () => {
    if (!supabase) return
    
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (data) {
      setTransactions(data)
      const total = data.reduce((acc, curr) => 
        curr.type === 'INCOME' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0)
      setBalance(total)
    }
    setLoading(false)
  }

  const handleAiInput = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isAiProcessing || !supabase) return

    setIsAiProcessing(true)
    try {
      const { data, error } = await supabase.functions.invoke('parse-transaction', {
        body: { input, userId: user?.id, householdId: household?.id }
      })

      if (error) throw error
      setInput('')
      await fetchDashboardData()
      
      if (household && supabase) {
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
      <header className="px-6 py-8 flex justify-between items-center max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl shadow-green-500/10">
            <UserIcon className="w-6 h-6 text-zinc-400" />
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Membro {household ? 'Casal' : 'Solo'}</p>
            <h2 className="font-black text-xl tracking-tight">{user?.user_metadata?.name?.split(' ')[0] || 'Usuário'}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 hover:bg-white/10 transition-all active:scale-90">
            <Bell className="w-5 h-5 text-zinc-400" />
          </button>
          <button onClick={signOut} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 hover:bg-red-500/10 group transition-all active:scale-90">
            <LogOut className="w-5 h-5 text-zinc-400 group-hover:text-red-400" />
          </button>
        </div>
      </header>

      <main className="px-6 max-w-4xl mx-auto pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* Balance Card */}
              <div className="glass-card p-10 bg-gradient-to-br from-green-500/10 via-transparent to-transparent relative overflow-hidden group">
                <div className="relative z-10 flex flex-col items-center text-center">
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-3">Patrimônio Total</p>
                  <h3 className="text-6xl font-black tracking-tighter">
                    <span className="text-zinc-600 mr-2 text-2xl font-bold italic">R$</span>
                    {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                  <div className="mt-8 flex gap-3">
                    <div className="bg-green-500/10 text-green-400 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-green-500/10 backdrop-blur-md">
                      +12.5% vs mês passado
                    </div>
                  </div>
                </div>
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-green-500/5 rounded-full blur-[120px] group-hover:bg-green-500/10 transition-all duration-1000" />
              </div>

              {/* Household Alert */}
              {!household && (
                <div className="bg-gradient-to-r from-pink-500/10 to-transparent border-l-4 border-pink-500 p-6 rounded-r-3xl flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <Heart className="w-6 h-6 text-pink-500 animate-pulse" />
                    <div>
                      <h4 className="font-bold text-sm">Conecte sua esposa</h4>
                      <p className="text-xs text-zinc-500">Compartilhem gastos e metas em tempo real.</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-pink-500/20 transition-all">
                    <UserPlus className="w-5 h-5 text-pink-500" />
                  </div>
                </div>
              )}

              {/* AI Input Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <Sparkles className="w-5 h-5 text-green-500" />
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Bucks Intelligence</h4>
                </div>
                <form onSubmit={handleAiInput} className="relative group">
                  <input
                    type="text"
                    placeholder="Ex: Paguei 45 no BK com o Nubank"
                    className="w-full bg-[#121212] border border-white/5 rounded-[2rem] px-8 py-6 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500/20 transition-all text-lg font-medium placeholder:text-zinc-700"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isAiProcessing}
                  />
                  <button 
                    type="submit"
                    disabled={isAiProcessing || !input}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-green-500 rounded-[1.2rem] flex items-center justify-center hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/20 transition-all active:scale-90 disabled:opacity-30"
                  >
                    {isAiProcessing ? (
                      <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-8 h-8 text-black" />
                    )}
                  </button>
                </form>
              </div>

              {/* Activity Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-end px-2">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Últimas Movimentações</h4>
                  <button className="text-[10px] font-black text-green-500 uppercase tracking-widest hover:text-green-400 transition-colors">Ver histórico completo</button>
                </div>

                <div className="space-y-4">
                  {transactions.map((tx, idx) => (
                    <motion.div 
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-zinc-700 transition-all hover:bg-[#111]"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-inner ${
                          tx.type === 'INCOME' 
                            ? 'bg-green-500/5 border-green-500/10 text-green-500' 
                            : 'bg-zinc-900 border-white/5 text-zinc-500'
                        }`}>
                          {tx.type === 'INCOME' ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownRight className="w-8 h-8" />}
                        </div>
                        <div>
                          <p className="font-black text-lg text-zinc-100 tracking-tight">{tx.description}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-zinc-900 px-2 py-0.5 rounded-md border border-white/5">{tx.category}</span>
                            <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">via {tx.sub_type || 'Manual'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-xl tracking-tighter ${tx.type === 'INCOME' ? 'text-green-500' : 'text-zinc-100'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-[9px] font-bold text-zinc-700 uppercase mt-1">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation - Premium Floating Bar */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-lg h-24 bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex justify-around items-center z-50 px-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]">
        {[
          { id: 'overview', icon: Wallet },
          { id: 'accounts', icon: Landmark },
          { id: 'cards', icon: CreditCard },
          { id: 'goals', icon: Target },
          { id: 'settings', icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`p-5 rounded-3xl transition-all duration-500 relative group ${
              activeTab === tab.id ? 'bg-green-500 text-black scale-110' : 'text-zinc-600 hover:text-white'
            }`}
          >
            <tab.icon className={`w-7 h-7 ${activeTab === tab.id ? 'stroke-[3]' : 'stroke-[2]'}`} />
            {activeTab === tab.id && (
              <motion.div layoutId="nav-bg" className="absolute inset-0 bg-green-500 rounded-3xl -z-10" />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
