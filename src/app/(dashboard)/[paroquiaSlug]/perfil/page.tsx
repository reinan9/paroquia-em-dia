'use client'

import { useState, useEffect, useRef } from 'react'
import { useParoquia } from '@/contexts/ParoquiaContext'

interface Profile {
    id: string
    nome: string | null
    telefone: string | null
    endereco: string | null
    foto_url: string | null
    email: string | null
    role: string
    created_at: string
}

export default function PerfilPage() {
    const { paroquia, paroquiaId, loading: ctxLoading } = useParoquia()
    const cor = paroquia?.cor_primaria || '#2563EB'
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [msg, setMsg] = useState('')
    const [form, setForm] = useState({
        nome: '',
        telefone: '',
        endereco: '',
        foto_url: '',
    })

    useEffect(() => {
        if (paroquiaId) fetchProfile()
    }, [paroquiaId])

    async function fetchProfile() {
        setLoading(true)
        const res = await fetch(`/api/perfil?paroquia_id=${paroquiaId}`)
        if (res.ok) {
            const data = await res.json()
            setProfile(data)
            setForm({
                nome: data.nome || '',
                telefone: data.telefone || '',
                endereco: data.endereco || '',
                foto_url: data.foto_url || '',
            })
        }
        setLoading(false)
    }

    async function handleSave() {
        setSaving(true)
        setMsg('')
        try {
            const res = await fetch('/api/perfil', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paroquia_id: paroquiaId, ...form }),
            })
            const data = await res.json()
            if (res.ok) {
                setMsg('Perfil atualizado!')
                setTimeout(() => setMsg(''), 3000)
            } else {
                setMsg(`Erro: ${data.error || 'Falha ao salvar'}`)
            }
        } catch {
            setMsg('Erro de rede')
        }
        setSaving(false)
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        setMsg('')
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', 'avatars')
            const res = await fetch('/api/upload', { method: 'POST', body: formData })
            const data = await res.json()
            if (res.ok) {
                setForm(prev => ({ ...prev, foto_url: data.url }))
                setMsg('Foto enviada! Clique em Salvar.')
                setTimeout(() => setMsg(''), 3000)
            } else {
                setMsg(`Erro: ${data.error}`)
            }
        } catch {
            setMsg('Erro ao enviar foto')
        }
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    if (ctxLoading || loading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

    const roleLabels: Record<string, string> = {
        super_admin: 'Super Admin',
        paroquia_admin: 'Administrador',
        padre: 'Padre',
        secretaria: 'Secretária',
        coordenador: 'Coordenador',
        membro: 'Membro',
        operador_pdv: 'Operador PDV',
    }

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">⚙️ Meu Perfil</h1>
                <p className="text-gray-500 text-sm mt-1">Gerencie suas informações pessoais</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header banner */}
                <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}CC)` }}>
                    <div className="absolute -bottom-10 left-6">
                        {form.foto_url ? (
                            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
                                <img src={form.foto_url} alt="Foto" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-bold"
                                style={{ backgroundColor: cor }}>
                                {(form.nome || profile?.email || '?')[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-14 px-6 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-bold text-gray-900 text-lg">{form.nome || profile?.email}</h2>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: `${cor}15`, color: cor }}>
                            {roleLabels[profile?.role || ''] || profile?.role}
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm">{profile?.email}</p>
                    {profile?.created_at && (
                        <p className="text-gray-300 text-xs mt-1">
                            Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </p>
                    )}
                </div>
            </div>

            {/* Edit Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Informações Pessoais</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                        <input type="text" value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm bg-gray-50 focus:bg-white"
                            placeholder="Seu nome completo" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone / WhatsApp</label>
                        <input type="tel" value={form.telefone}
                            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm bg-gray-50 focus:bg-white"
                            placeholder="(00) 00000-0000" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
                        <input type="text" value={form.endereco}
                            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm bg-gray-50 focus:bg-white"
                            placeholder="Rua, número, bairro, cidade" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto de Perfil</label>
                        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleUpload} className="hidden" />
                        {form.foto_url ? (
                            <div className="flex items-center gap-4">
                                <img src={form.foto_url} alt="Foto" className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200" />
                                <div className="space-y-2">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                                        className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700">
                                        {uploading ? '⏳ Enviando...' : '📷 Trocar Foto'}
                                    </button>
                                    <button type="button" onClick={() => setForm(prev => ({ ...prev, foto_url: '' }))}
                                        className="block text-xs text-red-500 hover:text-red-700 transition-colors">
                                        Remover foto
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                                className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors text-gray-500 hover:text-gray-700">
                                {uploading ? (
                                    <span className="text-sm">⏳ Enviando foto...</span>
                                ) : (
                                    <>
                                        <span className="text-2xl">📷</span>
                                        <span className="text-sm font-medium">Clique para enviar sua foto</span>
                                        <span className="text-xs text-gray-400">(máx. 2MB)</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-6">
                    <button onClick={handleSave} disabled={saving}
                        className="px-6 py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] text-sm"
                        style={{ backgroundColor: cor, boxShadow: `0 8px 20px ${cor}30` }}>
                        {saving ? 'Salvando...' : '💾 Salvar Perfil'}
                    </button>
                    {msg && (
                        <span className={`text-sm font-medium ${msg.startsWith('Erro') ? 'text-red-600' : 'text-green-600'}`}>
                            {msg}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
