'use client'

import { useState, useEffect } from 'react'
import { useParoquia } from '@/contexts/ParoquiaContext'
import { useUserRole } from '@/hooks/useUserRole'

interface Evento {
    id: string
    titulo: string
    descricao: string | null
    local: string | null
    data_inicio: string
    data_fim: string | null
    tipo: string
    tem_vendas: boolean
    created_at: string
}

export default function EventosPage() {
    const { paroquiaId, loading: ctxLoading } = useParoquia()
    const { isMembro } = useUserRole(paroquiaId)
    const canManage = !isMembro
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ titulo: '', descricao: '', local: '', data_inicio: '', data_fim: '', tem_vendas: false })
    const [eventos, setEventos] = useState<Evento[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        if (paroquiaId) fetchEventos()
    }, [paroquiaId])

    async function fetchEventos() {
        setLoading(true)
        const res = await fetch(`/api/eventos?paroquia_id=${paroquiaId}`)
        if (res.ok) setEventos(await res.json())
        setLoading(false)
    }

    async function handleSubmit() {
        if (!form.titulo || !form.data_inicio) return
        setSaving(true)
        if (editingId) {
            const res = await fetch('/api/eventos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingId, ...form }),
            })
            if (res.ok) { setEditingId(null); setShowForm(false); resetForm(); fetchEventos() }
        } else {
            const res = await fetch('/api/eventos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paroquia_id: paroquiaId, ...form }),
            })
            if (res.ok) { setShowForm(false); resetForm(); fetchEventos() }
        }
        setSaving(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Excluir evento?')) return
        await fetch('/api/eventos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        fetchEventos()
    }

    function resetForm() { setForm({ titulo: '', descricao: '', local: '', data_inicio: '', data_fim: '', tem_vendas: false }) }

    function startEdit(e: Evento) {
        setEditingId(e.id)
        setForm({
            titulo: e.titulo, descricao: e.descricao || '', local: e.local || '',
            data_inicio: e.data_inicio ? new Date(e.data_inicio).toISOString().slice(0, 16) : '',
            data_fim: e.data_fim ? new Date(e.data_fim).toISOString().slice(0, 16) : '',
            tem_vendas: e.tem_vendas,
        })
        setShowForm(true)
    }

    function formatDate(d: string) {
        return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    if (ctxLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">🎉 Eventos</h1>
                    <p className="text-gray-500 text-sm mt-1">{canManage ? 'Gerencie eventos da paróquia' : 'Eventos da paróquia'}</p>
                </div>
                {canManage && (
                    <button onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm() }}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm">
                        {showForm ? 'Cancelar' : '+ Novo Evento'}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-[slideUp_0.3s_ease-out]">
                    <h3 className="font-semibold text-gray-900 mb-4">{editingId ? 'Editar Evento' : 'Novo Evento'}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título *</label>
                            <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                placeholder="Ex.: Festa Junina 2026" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                            <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Local</label>
                            <input type="text" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                placeholder="Salão paroquial, área aberta, etc." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Início *</label>
                                <input type="datetime-local" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Fim</label>
                                <input type="datetime-local" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="temVendas" checked={form.tem_vendas}
                                onChange={(e) => setForm({ ...form, tem_vendas: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded" />
                            <label htmlFor="temVendas" className="text-sm text-gray-700">Evento com vendas (barracas/PDV)</label>
                        </div>
                        <button onClick={handleSubmit} disabled={saving || !form.titulo || !form.data_inicio}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm">
                            {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar Evento'}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-400">Carregando eventos...</div>
            ) : eventos.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <span className="text-5xl mb-4 block">🎉</span>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum evento</h3>
                    <p className="text-gray-500 text-sm">Crie um evento para começar.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {eventos.map((e) => (
                        <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">{e.titulo}</h3>
                                        {e.tem_vendas && <span className="inline-flex px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">🛒 Com vendas</span>}
                                    </div>
                                    {e.descricao && <p className="text-gray-500 text-sm mt-1 line-clamp-2">{e.descricao}</p>}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                        <span>📅 {formatDate(e.data_inicio)}</span>
                                        {e.local && <span>📍 {e.local}</span>}
                                    </div>
                                </div>
                                {canManage && (
                                    <div className="flex gap-1 ml-4">
                                        <button onClick={() => startEdit(e)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">✏️</button>
                                        <button onClick={() => handleDelete(e.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">🗑️</button>
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
