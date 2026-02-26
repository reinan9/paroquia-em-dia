'use client'

import { useState, useEffect } from 'react'
import { useParoquia } from '@/contexts/ParoquiaContext'
import { useUserRole } from '@/hooks/useUserRole'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Aviso { id: string; titulo: string; conteudo: string; created_at: string }
interface Evento { id: string; titulo: string; data_inicio: string; local: string | null }

export default function HomePage() {
    const { paroquia, paroquiaId, loading: ctxLoading } = useParoquia()
    const { isMembro, isAdmin, role, loading: roleLoading } = useUserRole(paroquiaId)
    const [avisos, setAvisos] = useState<Aviso[]>([])
    const [eventos, setEventos] = useState<Evento[]>([])
    const [stats, setStats] = useState({ membros: 0, avisos: 0, eventos: 0 })
    const pathname = usePathname()
    const slug = pathname.split('/')[1]

    useEffect(() => {
        if (paroquiaId) {
            fetch(`/api/avisos?paroquia_id=${paroquiaId}`).then(r => r.json()).then(d => {
                if (Array.isArray(d)) { setAvisos(d.slice(0, 5)); setStats(s => ({ ...s, avisos: d.length })) }
            })
            fetch(`/api/eventos?paroquia_id=${paroquiaId}`).then(r => r.json()).then(d => {
                if (Array.isArray(d)) { setEventos(d.slice(0, 5)); setStats(s => ({ ...s, eventos: d.length })) }
            })
        }
    }, [paroquiaId])

    if (ctxLoading || roleLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

    const cor = paroquia?.cor_primaria || '#2563EB'

    // ========= FIEL VIEW =========
    if (isMembro) {
        return (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                {/* Welcome */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Olá! 🙏</h1>
                    <p className="text-gray-500 text-sm mt-1">Bem-vindo à <strong>{paroquia?.nome}</strong></p>
                </div>

                {/* Parish banner with dynamic color */}
                <div className="rounded-2xl p-6 text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${cor}, ${cor}CC)`, boxShadow: `0 10px 30px ${cor}30` }}>
                    <div className="flex items-center gap-4">
                        {paroquia?.logo_url ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/20 shrink-0">
                                <img src={paroquia.logo_url} alt={paroquia.nome} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shrink-0">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                                </svg>
                            </div>
                        )}
                        <div>
                            <h2 className="font-bold text-lg">{paroquia?.nome}</h2>
                            <p className="text-white/80 text-sm">
                                {paroquia?.cidade}{paroquia?.estado ? ` - ${paroquia.estado}` : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick actions for fiel */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { href: `/${slug}/avisos`, icon: '📢', label: 'Avisos', color: 'bg-red-50 text-red-600' },
                        { href: `/${slug}/agenda`, icon: '📅', label: 'Agenda', color: 'bg-blue-50 text-blue-600' },
                        { href: `/${slug}/dizimo`, icon: '💛', label: 'Doação', color: 'bg-green-50 text-green-600' },
                        { href: `/${slug}/intencoes`, icon: '✝️', label: 'Intenções', color: 'bg-purple-50 text-purple-600' },
                    ].map((item) => (
                        <Link key={item.href} href={item.href}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center hover:shadow-md transition-all group">
                            <span className={`inline-flex w-12 h-12 items-center justify-center rounded-xl ${item.color} text-2xl mb-2 group-hover:scale-110 transition-transform`}>
                                {item.icon}
                            </span>
                            <p className="text-sm font-medium text-gray-700">{item.label}</p>
                        </Link>
                    ))}
                </div>

                {/* Recent announcements */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">📢 Últimos Avisos</h3>
                        <Link href={`/${slug}/avisos`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Ver todos →</Link>
                    </div>
                    {avisos.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                            <p className="text-sm">Nenhum aviso no momento.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {avisos.map(a => (
                                <div key={a.id} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <p className="text-sm font-medium text-gray-900">{a.titulo}</p>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.conteudo}</p>
                                    <p className="text-xs text-gray-300 mt-1">{new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming events */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">📅 Próximos Eventos</h3>
                        <Link href={`/${slug}/agenda`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Ver agenda →</Link>
                    </div>
                    {eventos.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                            <p className="text-sm">Nenhum evento próximo.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {eventos.map(e => (
                                <div key={e.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex flex-col items-center justify-center text-blue-600 shrink-0">
                                        <span className="text-xs font-bold uppercase">{new Date(e.data_inicio).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                        <span className="text-lg font-bold leading-none">{new Date(e.data_inicio).getDate()}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{e.titulo}</p>
                                        {e.local && <p className="text-xs text-gray-400">📍 {e.local}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // ========= ADMIN / STAFF VIEW =========
    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Bem-vindo! 👋</h1>
                <p className="text-gray-500 text-sm mt-1">Painel da paróquia <strong>{paroquia?.nome || paroquia?.slug}</strong></p>
            </div>

            {/* Admin Banner */}
            <div className="rounded-2xl p-6 text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${cor}, ${cor}CC)`, boxShadow: `0 10px 30px ${cor}30` }}>
                <h2 className="font-bold text-lg">{paroquia?.nome || 'Paróquia em Dia'}</h2>
                <p className="text-white/80 text-sm mt-1">Gerencie sua paróquia de forma moderna e eficiente. Acesse os módulos no menu lateral.</p>
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Membros', value: stats.membros, icon: '👥', color: 'blue' },
                    { label: 'Avisos', value: stats.avisos, icon: '📢', color: 'red' },
                    { label: 'Eventos', value: stats.eventos, icon: '📅', color: 'green' },
                    { label: 'Dízimo do Mês', value: 'R$ 0', icon: '💰', color: 'yellow' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{s.icon}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-sm text-gray-500">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Content Rows */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Últimos Avisos */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Últimos Avisos</h3>
                    </div>
                    {avisos.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <span className="text-3xl mb-2 block">📢</span>
                            <p className="text-sm">Nenhum aviso ainda.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {avisos.map(a => (
                                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                    <span className="text-lg">📢</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{a.titulo}</p>
                                        <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Próximos Eventos */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Próximos Eventos</h3>
                    </div>
                    {eventos.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <span className="text-3xl mb-2 block">📅</span>
                            <p className="text-sm">Nenhum evento próximo.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {eventos.map(e => (
                                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                    <span className="text-lg">📅</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{e.titulo}</p>
                                        <p className="text-xs text-gray-400">{new Date(e.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
