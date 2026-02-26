'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CriarParoquiaPage() {
    const [form, setForm] = useState({
        nome: '', endereco: '', cidade: '', estado: 'AL', telefone: '', email: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await fetch('/api/paroquias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })

        const data = await res.json()

        if (!res.ok) {
            setError(data.error || 'Erro ao criar paróquia')
            setLoading(false)
            return
        }

        router.push(`/${data.slug}/home`)
    }

    return (
        <div className="max-w-lg mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-bold text-sm">1</span>
                    <h1 className="text-2xl font-bold text-gray-900">Criar sua Paróquia</h1>
                </div>
                <p className="text-gray-500 ml-11">Preencha os dados da sua paróquia para começar.</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da Paróquia *</label>
                    <input type="text" required value={form.nome}
                        onChange={(e) => setForm({ ...form, nome: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                        placeholder="Ex.: Paróquia Nossa Senhora da Conceição" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
                    <input type="text" value={form.endereco}
                        onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                        placeholder="Rua, número, bairro" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
                        <input type="text" value={form.cidade}
                            onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                            placeholder="Maceió" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                        <select value={form.estado}
                            onChange={(e) => setForm({ ...form, estado: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50 focus:bg-white transition-all">
                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                <option key={uf} value={uf}>{uf}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                        <input type="tel" value={form.telefone}
                            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                            placeholder="(82) 99999-0000" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                        <input type="email" value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                            placeholder="contato@paroquia.com" />
                    </div>
                </div>

                <button type="submit" disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-600/25 mt-2">
                    {loading ? 'Criando...' : 'Continuar →'}
                </button>
            </form>
        </div>
    )
}
