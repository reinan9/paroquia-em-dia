'use client'

import { useState } from 'react'
import { useParoquia } from '@/contexts/ParoquiaContext'
import { useUserRole } from '@/hooks/useUserRole'

export default function DoacaoPage() {
    const { paroquia, paroquiaId, loading: ctxLoading, refresh } = useParoquia()
    const { isAdmin } = useUserRole(paroquiaId)
    const [copied, setCopied] = useState(false)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [pixForm, setPixForm] = useState({ pix_chave: '', pix_recebedor: '' })

    const pixKey = paroquia?.pix_chave || ''
    const recebedor = paroquia?.pix_recebedor || paroquia?.nome || ''

    function handleCopy() {
        if (!pixKey) return
        navigator.clipboard.writeText(pixKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    function startEditing() {
        setPixForm({
            pix_chave: paroquia?.pix_chave || '',
            pix_recebedor: paroquia?.pix_recebedor || paroquia?.nome || '',
        })
        setEditing(true)
    }

    async function handleSave() {
        if (!paroquia) return
        setSaving(true)
        const res = await fetch('/api/paroquias/slug', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: paroquia.id, ...pixForm }),
        })
        if (res.ok) {
            refresh()
            setEditing(false)
        }
        setSaving(false)
    }

    if (ctxLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

    // No PIX configured yet
    if (!pixKey && !isAdmin) {
        return (
            <div className="max-w-md mx-auto space-y-6 animate-[fadeIn_0.5s_ease-out]">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">💛 Doação</h1>
                    <p className="text-gray-500 text-sm mt-1">Contribua com a paróquia via PIX</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <span className="text-4xl block mb-3">🏗️</span>
                    <p className="text-gray-500 text-sm">A chave PIX ainda não foi configurada pela paróquia.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">💛 Doação</h1>
                <p className="text-gray-500 text-sm mt-1">Contribua com a paróquia via PIX</p>
            </div>

            {/* Admin editing mode */}
            {editing ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-[fadeIn_0.2s_ease-out]">
                    <h3 className="font-semibold text-gray-900 mb-4">⚙️ Configurar PIX</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Recebedor</label>
                            <input type="text" value={pixForm.pix_recebedor}
                                onChange={(e) => setPixForm({ ...pixForm, pix_recebedor: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                placeholder="Ex.: Paróquia São Miguel Arcanjo" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chave PIX</label>
                            <input type="text" value={pixForm.pix_chave}
                                onChange={(e) => setPixForm({ ...pixForm, pix_chave: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                                placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleSave} disabled={saving || !pixForm.pix_chave}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm">
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button onClick={() => setEditing(false)}
                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all text-sm">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-600/20">
                            <span className="text-4xl">💰</span>
                        </div>
                    </div>

                    {/* Recebedor */}
                    <div className="text-center mb-6">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Recebedor</p>
                        <p className="text-lg font-bold text-gray-900">{recebedor}</p>
                    </div>

                    {pixKey ? (
                        <>
                            {/* Chave PIX */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 text-center">Chave PIX</p>
                                <p className="text-center font-mono text-sm text-gray-700 break-all select-all">
                                    {pixKey}
                                </p>
                            </div>

                            {/* Copy button */}
                            <button
                                onClick={handleCopy}
                                className={`w-full py-3.5 font-semibold rounded-xl transition-all duration-300 text-sm active:scale-[0.98] ${copied
                                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40'
                                    }`}
                            >
                                {copied ? '✅ Chave copiada!' : '📋 Copiar chave PIX'}
                            </button>
                        </>
                    ) : (
                        <p className="text-center text-gray-400 text-sm">Nenhuma chave PIX configurada.</p>
                    )}

                    {/* Admin edit button */}
                    {isAdmin && (
                        <button onClick={startEditing}
                            className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-xl transition-all text-sm">
                            ⚙️ {pixKey ? 'Alterar chave PIX' : 'Configurar chave PIX'}
                        </button>
                    )}
                </div>
            )}

            <p className="text-center text-xs text-gray-400">
                Deus abençoe sua generosidade. 🙏
            </p>
        </div>
    )
}
