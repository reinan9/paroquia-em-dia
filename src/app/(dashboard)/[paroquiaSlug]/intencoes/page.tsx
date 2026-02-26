'use client'

import { useState, useEffect } from 'react'
import { useParoquia } from '@/contexts/ParoquiaContext'
import { useUserRole } from '@/hooks/useUserRole'

interface Intencao {
    id: string
    solicitante_nome: string
    intencao: string
    tipo: 'falecido' | 'vivo' | 'acao_gracas' | 'outro'
    data_missa: string | null
    horario_missa: string | null
    status: 'pendente' | 'aprovado' | 'rejeitado'
    observacao: string | null
    created_at: string
}

const tipoLabels: Record<string, string> = {
    falecido: '🕊️ Falecido(a)',
    vivo: '🙏 Vivo(a)',
    acao_gracas: '🙌 Ação de Graças',
    outro: '📝 Outra',
}

export default function IntencoesPage() {
    const { paroquia, paroquiaId, loading: ctxLoading } = useParoquia()
    const { isAdmin, isPadre, isMembro } = useUserRole(paroquiaId)
    const canManage = isAdmin || isPadre
    const cor = paroquia?.cor_primaria || '#2563EB'

    const [tab, setTab] = useState<'aprovados' | 'pendentes'>('aprovados')
    const [intencoes, setIntencoes] = useState<Intencao[]>([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [filterDate, setFilterDate] = useState('')
    const [form, setForm] = useState({
        solicitante_nome: '',
        intencao: '',
        tipo: 'falecido',
        data_missa: '',
        horario_missa: '',
    })

    useEffect(() => {
        if (paroquiaId) fetchData()
    }, [paroquiaId, tab, filterDate])

    async function fetchData() {
        setLoading(true)
        let url: string
        if (isMembro) {
            // Fiel only sees their own intentions
            url = `/api/intencoes?paroquia_id=${paroquiaId}&mine=true`
        } else {
            url = `/api/intencoes?paroquia_id=${paroquiaId}&status=${tab === 'aprovados' ? 'aprovado' : 'pendente'}`
            if (filterDate) url += `&data_missa=${filterDate}`
        }

        const res = await fetch(url)
        if (res.ok) {
            const data = await res.json()
            setIntencoes(Array.isArray(data) ? data : [])
        }
        setLoading(false)
    }

    async function handleCreate() {
        if (!form.solicitante_nome || !form.intencao) return
        setSaving(true)
        const res = await fetch('/api/intencoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paroquia_id: paroquiaId, ...form }),
        })
        if (res.ok) {
            setShowForm(false)
            setForm({ solicitante_nome: '', intencao: '', tipo: 'falecido', data_missa: '', horario_missa: '' })
            fetchData()
        }
        setSaving(false)
    }

    async function handleUpdateStatus(id: string, status: 'aprovado' | 'rejeitado') {
        await fetch('/api/intencoes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        })
        fetchData()
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir?')) return
        await fetch('/api/intencoes', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        fetchData()
    }

    function handleGeneratePDF() {
        if (!filterDate) { alert('Selecione uma data para gerar o PDF'); return }
        window.open(`/api/intencoes/pdf?paroquia_id=${paroquiaId}&data_missa=${filterDate}`, '_blank')
    }

    if (ctxLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">✝️ Intenções de Missa</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isMembro ? 'Envie suas intenções para as missas' : 'Envie e gerencie intenções para as missas'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {canManage && filterDate && (
                        <button onClick={handleGeneratePDF}
                            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-sm transition-all flex items-center gap-2">
                            🖨️ Gerar PDF
                        </button>
                    )}
                    <button onClick={() => setShowForm(true)}
                        className="px-4 py-2.5 text-white font-medium rounded-xl text-sm transition-all"
                        style={{ backgroundColor: cor, boxShadow: `0 8px 20px ${cor}30` }}>
                        + Nova Intenção
                    </button>
                </div>
            </div>

            {/* Filters - admin only */}
            {canManage && (
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex gap-2">
                        <button onClick={() => setTab('aprovados')}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                            style={tab === 'aprovados' ? { backgroundColor: `${cor}15`, color: cor } : { color: '#6b7280' }}>
                            Aprovadas ({intencoes.length})
                        </button>
                        <button onClick={() => setTab('pendentes')}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                            style={tab === 'pendentes' ? { backgroundColor: `${cor}15`, color: cor } : { color: '#6b7280' }}>
                            Pendentes
                        </button>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <label className="text-sm text-gray-500">Data da Missa:</label>
                        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm" />
                        {filterDate && <button onClick={() => setFilterDate('')} className="text-xs text-gray-400 hover:text-gray-600">✕ Limpar</button>}
                    </div>
                </div>
            )}

            {/* New Intention Form (Modal) */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
                        <h3 className="font-semibold text-gray-900 mb-4 text-lg">Nova Intenção de Missa</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Seu Nome</label>
                                <input type="text" value={form.solicitante_nome}
                                    onChange={(e) => setForm({ ...form, solicitante_nome: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm"
                                    placeholder="Nome do solicitante" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Intenção</label>
                                <textarea value={form.intencao}
                                    onChange={(e) => setForm({ ...form, intencao: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm resize-none"
                                    placeholder="Ex.: Pela alma de João da Silva, pela saúde de Maria..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                                <select value={form.tipo}
                                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm">
                                    <option value="falecido">🕊️ Falecido(a)</option>
                                    <option value="vivo">🙏 Vivo(a)</option>
                                    <option value="acao_gracas">🙌 Ação de Graças</option>
                                    <option value="outro">📝 Outra Intenção</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data da Missa</label>
                                    <input type="date" value={form.data_missa}
                                        onChange={(e) => setForm({ ...form, data_missa: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Horário</label>
                                    <input type="time" value={form.horario_missa}
                                        onChange={(e) => setForm({ ...form, horario_missa: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={handleCreate} disabled={saving || !form.solicitante_nome || !form.intencao}
                                    className="flex-1 py-3 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm"
                                    style={{ backgroundColor: cor }}>
                                    {saving ? 'Enviando...' : 'Enviar Intenção'}
                                </button>
                                <button onClick={() => setShowForm(false)}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all text-sm">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Intentions list */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {loading ? (
                    <div className="text-center py-12 text-gray-400">Carregando...</div>
                ) : intencoes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <span className="text-4xl mb-3 block">✝️</span>
                        <p className="font-semibold text-gray-900 mb-1">
                            {isMembro ? 'Nenhuma intenção enviada' : `Nenhuma intenção ${tab === 'aprovados' ? 'aprovada' : 'pendente'}`}
                        </p>
                        <p className="text-sm">Clique em &quot;+ Nova Intenção&quot; para enviar a primeira.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {intencoes.map(i => (
                            <div key={i.id} className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                style={{ backgroundColor: `${cor}15`, color: cor }}>
                                                {tipoLabels[i.tipo] || i.tipo}
                                            </span>
                                            {i.data_missa && (
                                                <span className="text-xs text-gray-400">
                                                    📅 {new Date(i.data_missa + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                    {i.horario_missa && ` às ${i.horario_missa}`}
                                                </span>
                                            )}
                                            {isMembro && (
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${i.status === 'aprovado' ? 'bg-green-50 text-green-700' :
                                                    i.status === 'pendente' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {i.status === 'aprovado' ? '✅' : i.status === 'pendente' ? '⏳' : '❌'} {i.status}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">{i.intencao}</p>
                                        <p className="text-xs text-gray-400 mt-1">Solicitado por: {i.solicitante_nome}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {tab === 'pendentes' && canManage && (
                                            <>
                                                <button onClick={() => handleUpdateStatus(i.id, 'aprovado')}
                                                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                                                    ✅ Aprovar
                                                </button>
                                                <button onClick={() => handleUpdateStatus(i.id, 'rejeitado')}
                                                    className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                                                    ❌ Rejeitar
                                                </button>
                                            </>
                                        )}
                                        {canManage && (
                                            <button onClick={() => handleDelete(i.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
