'use client'

import { useState } from 'react'
import { useParoquia } from '@/contexts/ParoquiaContext'
import { useUserRole } from '@/hooks/useUserRole'

export default function AgendaPage() {
    const { paroquiaId } = useParoquia()
    const { isMembro } = useUserRole(paroquiaId)
    const canManage = !isMembro
    const [showForm, setShowForm] = useState(false)
    const [view, setView] = useState<'list' | 'calendar'>('list')
    const [form, setForm] = useState({ titulo: '', descricao: '', local: '', data_inicio: '', data_fim: '', tipo: 'geral' })

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">📅 Agenda</h1>
                    <p className="text-gray-500 text-sm mt-1">Eventos e atividades da paróquia</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 rounded-xl p-1 flex">
                        <button onClick={() => setView('list')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                            Lista
                        </button>
                        <button onClick={() => setView('calendar')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                            Calendário
                        </button>
                    </div>
                    {canManage && (
                        <button onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm">
                            {showForm ? 'Cancelar' : '+ Novo Evento'}
                        </button>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-[slideUp_0.3s_ease-out]">
                    <h3 className="font-semibold text-gray-900 mb-4">Novo Evento</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título *</label>
                            <input type="text" value={form.titulo}
                                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                placeholder="Nome do evento" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                            <textarea value={form.descricao}
                                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                                placeholder="Detalhes do evento" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data/Hora Início *</label>
                                <input type="datetime-local" value={form.data_inicio}
                                    onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data/Hora Fim</label>
                                <input type="datetime-local" value={form.data_fim}
                                    onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Local</label>
                            <input type="text" value={form.local}
                                onChange={(e) => setForm({ ...form, local: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                placeholder="Local do evento" />
                        </div>
                        <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm">
                            Salvar Evento
                        </button>
                    </div>
                </div>
            )}

            {view === 'calendar' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="text-center py-12 text-gray-400">
                        <span className="text-5xl mb-4 block">📅</span>
                        <p className="text-sm">Visualização de calendário</p>
                        <p className="text-xs text-gray-300 mt-1">Conecte ao Supabase para ver eventos reais.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <span className="text-5xl mb-4 block">📅</span>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum evento</h3>
                    <p className="text-gray-500 text-sm">{canManage ? 'Clique em "Novo Evento" para criar o primeiro.' : 'Nenhum evento agendado no momento.'}</p>
                </div>
            )}
        </div>
    )
}
