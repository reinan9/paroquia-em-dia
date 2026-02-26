'use client'

import { useState, useEffect } from 'react'
import { useParoquia } from '@/contexts/ParoquiaContext'
import { useUserRole } from '@/hooks/useUserRole'

interface PedidoOracao {
    id: string
    nome_solicitante: string
    intencao: string
    status: 'pendente' | 'aprovado' | 'rejeitado'
    created_at: string
}

export default function OracaoPage() {
    const { paroquia, paroquiaId, loading: ctxLoading } = useParoquia()
    const { isMembro } = useUserRole(paroquiaId)
    const canManage = !isMembro
    const cor = paroquia?.cor_primaria || '#2563EB'

    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ nome_solicitante: '', intencao: '' })
    const [pedidos, setPedidos] = useState<PedidoOracao[]>([])
    const [tab, setTab] = useState<'aprovados' | 'pendentes'>('aprovados')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (paroquiaId) fetchPedidos()
    }, [paroquiaId])

    async function fetchPedidos() {
        setLoading(true)
        // Fiel only sees their own (approved) pedidos; admin sees all
        const url = isMembro
            ? `/api/oracao?paroquia_id=${paroquiaId}&mine=true`
            : `/api/oracao?paroquia_id=${paroquiaId}&all=true`
        const res = await fetch(url)
        if (res.ok) setPedidos(await res.json())
        setLoading(false)
    }

    async function handleSubmit() {
        if (!form.nome_solicitante || !form.intencao) return
        setSaving(true)
        const res = await fetch('/api/oracao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paroquia_id: paroquiaId, ...form }),
        })
        if (res.ok) { setShowForm(false); setForm({ nome_solicitante: '', intencao: '' }); fetchPedidos() }
        setSaving(false)
    }

    async function handleModerate(id: string, status: 'aprovado' | 'rejeitado') {
        await fetch('/api/oracao', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        })
        fetchPedidos()
    }

    const filtered = isMembro
        ? pedidos // fiel sees only their own already
        : pedidos.filter(p => tab === 'aprovados' ? p.status === 'aprovado' : p.status === 'pendente')

    if (ctxLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">🙏 Pedidos de Oração</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isMembro ? 'Envie seus pedidos de oração' : 'Envie e acompanhe pedidos de oração'}
                    </p>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2.5 text-white font-medium rounded-xl transition-all text-sm"
                    style={{ backgroundColor: cor, boxShadow: `0 8px 20px ${cor}30` }}>
                    {showForm ? 'Cancelar' : '+ Novo Pedido'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-[slideUp_0.3s_ease-out]">
                    <h3 className="font-semibold text-gray-900 mb-4">Novo Pedido de Oração</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Seu Nome</label>
                            <input type="text" value={form.nome_solicitante} onChange={(e) => setForm({ ...form, nome_solicitante: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm"
                                placeholder="Seu nome" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Intenção</label>
                            <textarea value={form.intencao} onChange={(e) => setForm({ ...form, intencao: e.target.value })} rows={4}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm resize-none"
                                placeholder="Escreva sua intenção de oração..." />
                        </div>
                        <button onClick={handleSubmit} disabled={saving || !form.nome_solicitante || !form.intencao}
                            className="px-6 py-2.5 disabled:opacity-50 text-white font-medium rounded-xl transition-all text-sm"
                            style={{ backgroundColor: cor, boxShadow: `0 8px 20px ${cor}30` }}>
                            {saving ? 'Enviando...' : 'Enviar Pedido'}
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs: only admin sees both */}
            {canManage && (
                <div className="flex gap-2">
                    <button onClick={() => setTab('aprovados')}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={tab === 'aprovados' ? { backgroundColor: `${cor}15`, color: cor } : { color: '#6b7280' }}>
                        Aprovados ({pedidos.filter(p => p.status === 'aprovado').length})
                    </button>
                    <button onClick={() => setTab('pendentes')}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={tab === 'pendentes' ? { backgroundColor: `${cor}15`, color: cor } : { color: '#6b7280' }}>
                        Pendentes ({pedidos.filter(p => p.status === 'pendente').length})
                    </button>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-400">Carregando...</div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <span className="text-5xl mb-4 block">🙏</span>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {isMembro ? 'Nenhum pedido enviado' : `Nenhum pedido ${tab === 'aprovados' ? 'aprovado' : 'pendente'}`}
                    </h3>
                    <p className="text-gray-500 text-sm">Clique em "Novo Pedido" para enviar o primeiro.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((p) => (
                        <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{p.nome_solicitante}</p>
                                    <p className="text-gray-500 text-sm mt-1">{p.intencao}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="text-xs text-gray-300">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                                        {isMembro && (
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.status === 'aprovado' ? 'bg-green-50 text-green-700' :
                                                p.status === 'pendente' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                {p.status === 'aprovado' ? '✅ Aprovado' : p.status === 'pendente' ? '⏳ Pendente' : '❌ Rejeitado'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {tab === 'pendentes' && canManage && (
                                    <div className="flex gap-2 ml-4">
                                        <button onClick={() => handleModerate(p.id, 'aprovado')}
                                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                                            ✅ Aprovar
                                        </button>
                                        <button onClick={() => handleModerate(p.id, 'rejeitado')}
                                            className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                                            ❌ Rejeitar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
