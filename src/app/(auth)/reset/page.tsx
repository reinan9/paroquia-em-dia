'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ResetPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    async function handleReset(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        setSent(true)
        setLoading(false)
    }

    if (sent) {
        return (
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 text-center animate-[fadeIn_0.5s_ease-out]">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">E-mail enviado!</h2>
                <p className="text-gray-500 mb-6">Verifique sua caixa de entrada para redefinir a senha.</p>
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Voltar ao login
                </Link>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Redefinir senha</h2>
            <p className="text-gray-500 text-sm mb-6">Enviaremos um link para redefinir sua senha.</p>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
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

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-600/25"
                >
                    {loading ? 'Enviando...' : 'Enviar link'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Voltar ao login
                </Link>
            </p>
        </div>
    )
}
