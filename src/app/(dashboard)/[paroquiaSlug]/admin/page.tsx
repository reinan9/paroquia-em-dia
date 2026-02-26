'use client'

import { useState, useEffect } from 'react'
import { useParoquia } from '@/contexts/ParoquiaContext'

export default function AdminPage() {
    const { paroquia, paroquiaId, loading: ctxLoading, refresh } = useParoquia()
    const [tab, setTab] = useState<'membros' | 'relatorios' | 'configuracoes'>('membros')
    const [form, setForm] = useState({
        nome: '',
        telefone: '',
        email: '',
        cor_primaria: '#2563EB',
        logo_url: '',
        pix_chave: '',
        pix_recebedor: '',
    })
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState('')

    useEffect(() => {
        if (paroquia) {
            setForm({
                nome: paroquia.nome || '',
                telefone: paroquia.telefone || '',
                email: paroquia.email || '',
                cor_primaria: paroquia.cor_primaria || '#2563EB',
                logo_url: paroquia.logo_url || '',
                pix_chave: paroquia.pix_chave || '',
                pix_recebedor: paroquia.pix_recebedor || '',
            })
        }
    }, [paroquia])

    async function handleSaveSettings() {
        if (!paroquia) return
        setSaving(true)
        setSaveMsg('')
        try {
            const res = await fetch('/api/paroquias/slug', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: paroquia.id, ...form }),
            })
            const data = await res.json()
            if (res.ok) {
                setSaveMsg('Configurações salvas!')
                refresh()
                setTimeout(() => setSaveMsg(''), 3000)
            } else {
                setSaveMsg(`Erro: ${data.error || res.statusText}`)
            }
        } catch (err: unknown) {
            setSaveMsg(`Erro de rede: ${err instanceof Error ? err.message : String(err)}`)
        }
        setSaving(false)
    }

    if (ctxLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">⚙️ Administração</h1>
                <p className="text-gray-500 text-sm mt-1">Gerencie membros, relatórios e configurações</p>
            </div>

            <div className="flex gap-2">
                {[
                    { key: 'membros', label: 'Membros' },
                    { key: 'relatorios', label: 'Relatórios' },
                    { key: 'configuracoes', label: 'Configurações' },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'membros' && (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Membros da Paróquia</h3>
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-all">
                                + Convidar Membro
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b border-gray-100">
                                        <th className="py-3 px-4 font-medium">Nome</th>
                                        <th className="py-3 px-4 font-medium">Função</th>
                                        <th className="py-3 px-4 font-medium">Status</th>
                                        <th className="py-3 px-4 font-medium">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-50">
                                        <td className="py-3 px-4 text-gray-900">Você (Admin)</td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">Admin</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">Ativo</span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-400">—</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'relatorios' && (
                <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Membros', value: '1', icon: '👥' },
                            { label: 'Avisos Publicados', value: '0', icon: '📢' },
                            { label: 'Eventos Realizados', value: '0', icon: '📅' },
                            { label: 'Doações', value: 'PIX', icon: '💛' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <span className="text-2xl mb-2 block">{stat.icon}</span>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'configuracoes' && (
                <div className="space-y-4">
                    {/* Dados da Paróquia */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Dados da Paróquia</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                                    <input type="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logomarca */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">🖼️ Logomarca</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-6">
                                {/* Preview */}
                                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                                    {form.logo_url ? (
                                        <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <span className="text-3xl text-gray-300">🏛️</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">URL da Logomarca</label>
                                    <input type="url" value={form.logo_url}
                                        onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        placeholder="https://exemplo.com/logo.png" />
                                    <p className="text-xs text-gray-400 mt-1">Cole a URL de uma imagem hospedada (ex: Google Drive, Imgur, etc.)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cores */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">🎨 Cor da Paróquia</h3>
                        <p className="text-sm text-gray-500 mb-4">Essa cor será usada no banner e destaques visíveis aos fiéis.</p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <input type="color" value={form.cor_primaria}
                                    onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })}
                                    className="w-14 h-14 rounded-xl border border-gray-200 cursor-pointer" />
                                <input type="text" value={form.cor_primaria}
                                    onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })}
                                    className="w-32 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono" />
                            </div>
                            {/* Preview */}
                            <div className="rounded-xl p-4 text-white shadow-sm" style={{ backgroundColor: form.cor_primaria }}>
                                <p className="font-bold">{form.nome || 'Paróquia'}</p>
                                <p className="text-sm opacity-80">Prévia de como ficará para os fiéis</p>
                            </div>
                            {/* Quick colors */}
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { color: '#2563EB', label: 'Azul' },
                                    { color: '#7C3AED', label: 'Roxo' },
                                    { color: '#059669', label: 'Verde' },
                                    { color: '#DC2626', label: 'Vermelho' },
                                    { color: '#D97706', label: 'Dourado' },
                                    { color: '#0891B2', label: 'Turquesa' },
                                    { color: '#4338CA', label: 'Índigo' },
                                    { color: '#BE185D', label: 'Rosa' },
                                ].map(c => (
                                    <button key={c.color}
                                        onClick={() => setForm({ ...form, cor_primaria: c.color })}
                                        className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 ${form.cor_primaria === c.color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c.color }}
                                        title={c.label} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* PIX */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">💰 Chave PIX (Doação)</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Recebedor</label>
                                <input type="text" value={form.pix_recebedor}
                                    onChange={(e) => setForm({ ...form, pix_recebedor: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    placeholder="Nome que aparecerá para os fiéis" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Chave PIX</label>
                                <input type="text" value={form.pix_chave}
                                    onChange={(e) => setForm({ ...form, pix_chave: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                                    placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória" />
                            </div>
                        </div>
                    </div>

                    {/* Save */}
                    <div className="flex items-center gap-4">
                        {saveMsg && (
                            <p className={`text-sm font-medium ${saveMsg.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
                                {saveMsg}
                            </p>
                        )}
                        <button onClick={handleSaveSettings} disabled={saving}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm">
                            {saving ? 'Salvando...' : '💾 Salvar Todas as Configurações'}
                        </button>
                    </div>

                    {/* Plan */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Plano</h3>
                        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div>
                                <p className="font-medium text-green-800">Plano Gratuito</p>
                                <p className="text-sm text-green-600">Todos os recursos disponíveis sem custo.</p>
                            </div>
                            <span className="inline-flex px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg">GRATUITO</span>
                        </div>
                    </div>

                    {/* Link para fiéis */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">🔗 Link para Fiéis</h3>
                        <p className="text-sm text-gray-500 mb-3">Compartilhe este link para os fiéis se cadastrarem na sua paróquia:</p>
                        <div className="flex items-center gap-2">
                            <input type="text" readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${paroquia?.slug}/entrar`}
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-700" />
                            <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${paroquia?.slug}/entrar`)}
                                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-all whitespace-nowrap">
                                📋 Copiar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
