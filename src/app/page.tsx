'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Wallet, LogIn, UserPlus, Heart, Lock, Mail, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    if (!supabase) {
      setError('Supabase não configurado. Configure as variáveis de ambiente.')
      setLoading(false)
      return
    }
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name } }
        })
        if (error) throw error
        alert('Confirme seu e-mail para ativar a conta!')
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erro na autenticação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6 selection:bg-brand-500/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-8 md:p-10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="w-16 h-16 bg-brand-500/10 rounded-3xl flex items-center justify-center mb-4"
          >
            <Wallet className="w-8 h-8 text-brand-500" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight">Bucks Flow</h1>
          <p className="text-surface-400 mt-2 text-sm max-w-[260px]">
            {isLogin ? 'Bem-vindo de volta ao seu controle financeiro inteligente' : 'Comece agora sua jornada para a liberdade financeira'}
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs mb-6 text-center">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="text" placeholder="Nome Completo" required
                    className="input-field pl-12"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="email" placeholder="E-mail" required
              className="input-field pl-12"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="password" placeholder="Senha" required
              className="input-field pl-12"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-3">
            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-surface-400 hover:text-brand-500 transition-colors">
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já possui conta? Entre aqui'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
