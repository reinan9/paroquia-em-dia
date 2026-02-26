'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

interface ParoquiaInfo {
    id: string
    nome: string
    cor_primaria: string | null
    logo_url: string | null
}

export default function EntrarPage() {
    const [mode, setMode] = useState<'login' | 'cadastro'>('login')
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [paroquiaInfo, setParoquiaInfo] = useState<ParoquiaInfo | null>(null)
    const router = useRouter()
    const params = useParams()
    const slug = params.paroquiaSlug as string
    const supabase = createClient()

    const cor = paroquiaInfo?.cor_primaria || '#2563EB'

    useEffect(() => {
        fetch(`/api/paroquias/slug?slug=${slug}`)
            .then(res => res.json())
            .then(data => {
                if (data?.nome) setParoquiaInfo(data)
            })
            .catch(() => { })
    }, [slug])

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

        if (loginError) {
            setError('E-mail ou senha incorretos.')
            setLoading(false)
            return
        }

        setSuccess(true)
        setTimeout(() => {
            router.push(`/${slug}/home`)
            router.refresh()
        }, 1000)
    }

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.')
            setLoading(false)
            return
        }

        const res = await fetch('/api/auth/entrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, password, paroquia_id: paroquiaInfo?.id }),
        })

        const data = await res.json()

        if (!res.ok) {
            setError(data.error || 'Erro ao criar conta')
            setLoading(false)
            return
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

        if (loginError) {
            setError('Conta criada, mas erro ao entrar. Tente fazer login.')
            setLoading(false)
            return
        }

        setSuccess(true)
        setTimeout(() => {
            router.push(`/${slug}/home`)
            router.refresh()
        }, 1000)
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${cor}10, white, ${cor}10)` }}>
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 text-center animate-[fadeIn_0.5s_ease-out] max-w-md w-full">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Bem-vindo!</h2>
                    <p className="text-gray-500">Redirecionando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${cor}15, white, ${cor}15)` }}>
            <div className="max-w-md w-full">
                {/* Header with logo + color */}
                <div className="text-center mb-8">
                    {paroquiaInfo?.logo_url ? (
                        <div className="w-20 h-20 rounded-2xl mx-auto mb-4 overflow-hidden shadow-lg" style={{ boxShadow: `0 10px 30px ${cor}30` }}>
                            <img src={paroquiaInfo.logo_url} alt={paroquiaInfo.nome} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${cor}, ${cor}CC)`, boxShadow: `0 10px 30px ${cor}30` }}>
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                            </svg>
                        </div>
                    )}
                    <h1 className="text-2xl font-bold text-gray-900">
                        {paroquiaInfo?.nome || 'Paróquia em Dia'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-2">
                        {mode === 'login' ? 'Entre com sua conta' : 'Crie sua conta para acessar a paróquia'}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 animate-[fadeIn_0.5s_ease-out]">
                    {/* Tab toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                        <button onClick={() => { setMode('login'); setError('') }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                            Entrar
                        </button>
                        <button onClick={() => { setMode('cadastro'); setError('') }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'cadastro' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                            Criar Conta
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {mode === 'login' ? (
                        /* ====== LOGIN FORM ====== */
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                                    placeholder="seu@email.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                                    placeholder="Sua senha" />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full py-3 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
                                style={{ backgroundColor: cor, boxShadow: `0 10px 30px ${cor}40` }}>
                                {loading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </form>
                    ) : (
                        /* ====== SIGNUP FORM ====== */
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                                    placeholder="Seu nome completo" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                                    placeholder="seu@email.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                                    placeholder="Mínimo 6 caracteres" />
                            </div>
                            <button type="submit" disabled={loading || !paroquiaInfo?.id}
                                className="w-full py-3 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
                                style={{ backgroundColor: cor, boxShadow: `0 10px 30px ${cor}40` }}>
                                {loading ? 'Criando conta...' : 'Criar Conta'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
