'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.')
            setLoading(false)
            return
        }

        // Create user via API (bypasses trigger issues)
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, password }),
        })

        const data = await res.json()

        if (!res.ok) {
            setError(data.error || 'Erro ao criar conta')
            setLoading(false)
            return
        }

        // Auto-login after signup
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

        if (loginError) {
            setError('Conta criada, mas erro ao entrar. Tente fazer login.')
            setLoading(false)
            return
        }

        setSuccess(true)
        setTimeout(() => {
            router.push('/criar-paroquia')
            router.refresh()
        }, 1500)
    }

    if (success) {
        return (
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 text-center animate-[fadeIn_0.5s_ease-out]">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Conta criada!</h2>
                <p className="text-gray-500">Redirecionando...</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Criar sua conta</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                    <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                        placeholder="Seu nome completo"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                        placeholder="seu@email.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.98]"
                >
                    {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
                Já tem conta?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Fazer login
                </Link>
            </p>
        </div>
    )
}
