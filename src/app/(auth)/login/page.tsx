'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError(error.message === 'Invalid login credentials'
                ? 'E-mail ou senha incorretos.'
                : error.message)
            setLoading(false)
            return
        }

        // Check if user already has a paróquia
        try {
            const res = await fetch('/api/paroquias')
            const paroquias = await res.json()
            if (Array.isArray(paroquias) && paroquias.length > 0) {
                router.push(`/${paroquias[0].slug}/home`)
            } else {
                router.push('/criar-paroquia')
            }
        } catch {
            router.push('/criar-paroquia')
        }
        router.refresh()
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Entrar na sua conta</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.98]"
                >
                    {loading ? (
                        <span className="inline-flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Entrando...
                        </span>
                    ) : 'Entrar'}
                </button>
            </form>

            <div className="mt-6 space-y-3 text-center text-sm">
                <Link href="/reset" className="text-blue-600 hover:text-blue-700 font-medium">
                    Esqueceu a senha?
                </Link>
                <p className="text-gray-500">
                    Não tem conta?{' '}
                    <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                        Criar conta
                    </Link>
                </p>
            </div>
        </div>
    )
}
