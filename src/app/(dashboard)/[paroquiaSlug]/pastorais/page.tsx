'use client'

import { useState, useEffect } from 'react'
import { useParoquia } from '@/contexts/ParoquiaContext'
import { useUserRole } from '@/hooks/useUserRole'

interface Pastoral {
    id: string
    nome: string
    descricao: string | null
    dia_reuniao: string | null
    horario_reuniao: string | null
    ativa: boolean
    pastoral_membros: { count: number }[] | null
}

export default function PastoraisPage() {
    const { paroquia, paroquiaId, loading: ctxLoading } = useParoquia()
    const { isMembro } = useUserRole(paroquiaId)
    const canManage = !isMembro
    const cor = paroquia?.cor_primaria || '#2563EB'

    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ nome: '', descricao: '', dia_reuniao: '', horario_reuniao: '' })
    const [pastorais, setPastorais] = useState<Pastoral[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        if (paroquiaId) fetchPastorais()
    }, [paroquiaId])

    async function fetchPastorais() {
        setLoading(true)
        const res = await fetch(`/api/pastorais?paroquia_id=${paroquiaId}`)
        if (res.ok) setPastorais(await res.json())
        setLoading(false)
    }

    async function handleSubmit() {
        if (!form.nome) return
        setSaving(true)
        if (editingId) {
            const res = await fetch('/api/pastorais', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingId, ...form }),
            })
            if (res.ok) { setEditingId(null); setShowForm(false); setForm({ nome: '', descricao: '', dia_reuniao: '', horario_reuniao: '' }); fetchPastorais() }
        } else {
            const res = await fetch('/api/pastorais', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paroquia_id: paroquiaId, ...form }),
            })
            if (res.ok) { setShowForm(false); setForm({ nome: '', descricao: '', dia_reuniao: '', horario_reuniao: '' }); fetchPastorais() }
        }
        setSaving(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Excluir pastoral?')) return
        await fetch('/api/pastorais', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        fetchPastorais()
    }

    function startEdit(p: Pastoral) {
        setEditingId(p.id)
        setForm({ nome: p.nome, descricao: p.descricao || '', dia_reuniao: p.dia_reuniao || '', horario_reuniao: p.horario_reuniao || '' })
        setShowForm(true)
    }

    if (ctxLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

    // ========= FIEL VIEW - List with contact =========
    if (isMembro) {
        return (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">👥 Pastorais</h1>
                    <p className="text-gray-500 text-sm mt-1">Conheça as pastorais da paróquia</p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-400">Carregando...</div>
                ) : pastorais.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <span className="text-5xl mb-4 block">👥</span>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma pastoral cadastrada</h3>
                        <p className="text-gray-500 text-sm">As pastorais da paróquia aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pastorais.map(p => (
                            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white text-xl"
                                        style={{ backgroundColor: cor }}>
                                        👥
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900">{p.nome}</h3>
                                        {p.descricao && <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{p.descricao}</p>}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                            {p.dia_reuniao && <span>📅 {p.dia_reuniao}</span>}
                                            {p.horario_reuniao && <span>🕐 {p.horario_reuniao}</span>}
                                            <span>👥 {p.pastoral_membros?.[0]?.count || 0} membros</span>
                                        </div>
                                    </div>
                                    {/* Contact button */}
                                    <button
                                        onClick={() => {
                                            const phone = paroquia?.telefone?.replace(/\D/g, '')
                                            const msg = encodeURIComponent(`Olá! Gostaria de saber mais sobre a pastoral "${p.nome}".`)
                                            if (phone) {
                                                window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank')
                                            } else {
                                                alert('Telefone da paróquia não cadastrado. Entre em contato por e-mail.')
                                            }
                                        }}
                                        className="shrink-0 px-4 py-2.5 text-white font-medium rounded-xl text-sm transition-all whitespace-nowrap"
                                        style={{ backgroundColor: cor, boxShadow: `0 6px 15px ${cor}30` }}>
                                        💬 Contato
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // ========= ADMIN VIEW =========
    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">👥 Pastorais</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerencie as pastorais e seus membros</p>
                </div>
                <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ nome: '', descricao: '', dia_reuniao: '', horario_reuniao: '' }) }}
                    className="px-4 py-2.5 text-white font-medium rounded-xl transition-all text-sm"
                    style={{ backgroundColor: cor, boxShadow: `0 8px 20px ${cor}30` }}>
                    {showForm ? 'Cancelar' : '+ Nova Pastoral'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-[slideUp_0.3s_ease-out]">
                    <h3 className="font-semibold text-gray-900 mb-4">{editingId ? 'Editar Pastoral' : 'Nova Pastoral'}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
                            <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm"
                                placeholder="Ex.: Pastoral da Juventude" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                            <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm resize-none"
                                placeholder="Descrição da pastoral" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dia da Reunião</label>
                                <select value={form.dia_reuniao} onChange={(e) => setForm({ ...form, dia_reuniao: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm">
                                    <option value="">Selecione</option>
                                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Horário</label>
                                <input type="time" value={form.horario_reuniao} onChange={(e) => setForm({ ...form, horario_reuniao: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm" />
                            </div>
                        </div>
                        <button onClick={handleSubmit} disabled={saving || !form.nome}
                            className="px-6 py-2.5 disabled:opacity-50 text-white font-medium rounded-xl transition-all text-sm"
                            style={{ backgroundColor: cor, boxShadow: `0 8px 20px ${cor}30` }}>
                            {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar Pastoral'}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-400">Carregando pastorais...</div>
            ) : pastorais.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <span className="text-5xl mb-4 block">👥</span>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma pastoral</h3>
                    <p className="text-gray-500 text-sm">Clique em &quot;Nova Pastoral&quot; para criar a primeira.</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pastorais.map((p) => (
                        <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">{p.nome}</h3>
                                <div className="flex gap-1">
                                    <button onClick={() => startEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">✏️</button>
                                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">🗑️</button>
                                </div>
                            </div>
                            {p.descricao && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{p.descricao}</p>}
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                {p.dia_reuniao && <span>📅 {p.dia_reuniao}</span>}
                                {p.horario_reuniao && <span>🕐 {p.horario_reuniao}</span>}
                                <span>👥 {p.pastoral_membros?.[0]?.count || 0} membros</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
