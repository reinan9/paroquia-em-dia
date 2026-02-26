'use client'

import { useState, useEffect } from 'react'
import { useParoquia } from '@/contexts/ParoquiaContext'
import { useUserRole } from '@/hooks/useUserRole'

interface Aviso {
    id: string
    titulo: string
    conteudo: string
    publicado: boolean
    created_at: string
}

export default function AvisosPage() {
    const { paroquiaId, loading: ctxLoading } = useParoquia()
    const { isMembro } = useUserRole(paroquiaId)
    const canManage = !isMembro
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ titulo: '', conteudo: '', publicado: true })
    const [avisos, setAvisos] = useState<Aviso[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        if (paroquiaId) fetchAvisos()
    }, [paroquiaId])

    async function fetchAvisos() {
        setLoading(true)
        const res = await fetch(`/api/avisos?paroquia_id=${paroquiaId}`)
        if (res.ok) setAvisos(await res.json())
        setLoading(false)
    }

    async function handleSubmit() {
        if (!form.titulo || !form.conteudo) return
        setSaving(true)

        if (editingId) {
            const res = await fetch('/api/avisos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingId, ...form }),
            })
            if (res.ok) {
                setEditingId(null)
                setShowForm(false)
                setForm({ titulo: '', conteudo: '', publicado: true })
                fetchAvisos()
            }
        } else {
            const res = await fetch('/api/avisos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paroquia_id: paroquiaId, ...form }),
            })
            if (res.ok) {
                setShowForm(false)
                setForm({ titulo: '', conteudo: '', publicado: true })
                fetchAvisos()
            }
        }
        setSaving(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Excluir aviso?')) return
        await fetch('/api/avisos', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        fetchAvisos()
    }

    function startEdit(aviso: Aviso) {
        setEditingId(aviso.id)
        setForm({ titulo: aviso.titulo, conteudo: aviso.conteudo, publicado: aviso.publicado })
        setShowForm(true)
    }

    if (ctxLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">📢 Avisos</h1>
                    <p className="text-gray-500 text-sm mt-1">{canManage ? 'Gerencie os avisos da paróquia' : 'Avisos da paróquia'}</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ titulo: '', conteudo: '', publicado: true }) }}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm"
                    >
                        {showForm ? 'Cancelar' : '+ Novo Aviso'}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-[slideUp_0.3s_ease-out]">
                    <h3 className="font-semibold text-gray-900 mb-4">{editingId ? 'Editar Aviso' : 'Novo Aviso'}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título</label>
                            <input
                                type="text" value={form.titulo}
                                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                placeholder="Título do aviso"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Conteúdo</label>
                            <textarea
                                value={form.conteudo}
                                onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                                placeholder="Escreva o conteúdo do aviso..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="publicado" checked={form.publicado}
                                onChange={(e) => setForm({ ...form, publicado: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded" />
                            <label htmlFor="publicado" className="text-sm text-gray-700">Publicar imediatamente</label>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || !form.titulo || !form.conteudo}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm"
                        >
                            {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar Aviso'}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-400">Carregando avisos...</div>
            ) : avisos.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <span className="text-5xl mb-4 block">📢</span>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum aviso</h3>
                    <p className="text-gray-500 text-sm">Clique em &quot;Novo Aviso&quot; para criar o primeiro.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {avisos.map((aviso) => (
                        <div key={aviso.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{aviso.titulo}</h3>
                                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{aviso.conteudo}</p>
                                    <p className="text-xs text-gray-300 mt-2">{new Date(aviso.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${aviso.publicado ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                                        {aviso.publicado ? 'Publicado' : 'Rascunho'}
                                    </span>
                                    {canManage && (
                                        <>
                                            <button onClick={() => startEdit(aviso)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">✏️</button>
                                            <button onClick={() => handleDelete(aviso.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">🗑️</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
