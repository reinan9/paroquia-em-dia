'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ParoquiaProvider, useParoquia } from '@/contexts/ParoquiaContext'
import { useUserRole } from '@/hooks/useUserRole'

interface NavItem {
    href: string
    label: string
    icon: string
    roles: string[] // empty = all roles
}

const allNavItems: NavItem[] = [
    { href: 'home', label: 'Início', icon: '🏠', roles: [] },
    { href: 'avisos', label: 'Avisos', icon: '📢', roles: [] },
    { href: 'agenda', label: 'Agenda', icon: '📅', roles: [] },
    { href: 'pastorais', label: 'Pastorais', icon: '👥', roles: [] },
    { href: 'oracao', label: 'Oração', icon: '🙏', roles: [] },
    { href: 'intencoes', label: 'Intenções', icon: '✝️', roles: [] },
    { href: 'dizimo', label: 'Doação', icon: '💛', roles: [] },
    { href: 'eventos', label: 'Eventos', icon: '🎉', roles: ['super_admin', 'paroquia_admin', 'padre', 'secretaria', 'coordenador'] },
    { href: 'pdv', label: 'PDV', icon: '🛒', roles: ['super_admin', 'paroquia_admin', 'secretaria', 'operador_pdv'] },
    { href: 'perfil', label: 'Meu Perfil', icon: '👤', roles: [] },
    { href: 'admin', label: 'Admin', icon: '⚙️', roles: ['super_admin', 'paroquia_admin', 'padre'] },
]

function DashboardContent({ children, slug }: { children: React.ReactNode; slug: string }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { paroquia, paroquiaId, loading: paroquiaLoading } = useParoquia()
    const { role, loading: roleLoading } = useUserRole(paroquiaId)

    const cor = paroquia?.cor_primaria || '#2563EB'
    const [userFoto, setUserFoto] = useState('')
    const [userNome, setUserNome] = useState('')

    useEffect(() => {
        if (paroquiaId) {
            fetch(`/api/perfil?paroquia_id=${paroquiaId}`)
                .then(r => r.ok ? r.json() : null)
                .then(d => {
                    if (d) {
                        setUserFoto(d.foto_url || '')
                        setUserNome(d.nome || d.email || '')
                    }
                })
                .catch(() => { })
        }
    }, [paroquiaId])

    const navItems = allNavItems.filter(item => {
        if (item.roles.length === 0) return true
        if (!role) return false
        return item.roles.includes(role)
    })

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const roleLabels: Record<string, string> = {
        super_admin: 'Super Admin',
        paroquia_admin: 'Administrador',
        padre: 'Padre',
        secretaria: 'Secretária',
        coordenador: 'Coordenador',
        membro: 'Membro',
        operador_pdv: 'Operador PDV',
    }

    // Block rendering until role and parish data are loaded
    if (paroquiaLoading || roleLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center animate-pulse">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-100 shadow-xl lg:shadow-none transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>
                <div className="flex flex-col h-full">
                    {/* Brand - uses parish color + logo */}
                    <div className="p-5 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            {paroquia?.logo_url ? (
                                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0">
                                    <img src={paroquia.logo_url} alt={paroquia.nome} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                                    style={{ background: `linear-gradient(135deg, ${cor}, ${cor}CC)` }}>
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                                    </svg>
                                </div>
                            )}
                            <div className="min-w-0">
                                <h2 className="font-bold text-gray-900 text-sm truncate">{paroquia?.nome || 'Paróquia em Dia'}</h2>
                                <p className="text-xs text-gray-400 truncate">{slug}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 overflow-y-auto">
                        <ul className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = pathname.includes(`/${item.href}`)
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={`/${slug}/${item.href}`}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                                ? 'shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            style={isActive ? { backgroundColor: `${cor}12`, color: cor } : undefined}
                                        >
                                            <span className="text-lg">{item.icon}</span>
                                            {item.label}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100">
                        {role && (
                            <div className="px-4 py-2 mb-2">
                                <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium"
                                    style={{ backgroundColor: `${cor}15`, color: cor }}>
                                    {roleLabels[role] || role}
                                </span>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                            <span className="text-lg">🚪</span>
                            Sair
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                    <Link href={`/${slug}/perfil`} className="flex items-center gap-3 group">
                        {userFoto ? (
                            <img src={userFoto} alt="Perfil" className="w-9 h-9 rounded-full object-cover border-2 border-transparent group-hover:border-gray-200 transition-all" />
                        ) : (
                            <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover:ring-2 group-hover:ring-gray-200 transition-all"
                                style={{ backgroundColor: `${cor}20` }}>
                                <span className="font-bold text-xs" style={{ color: cor }}>
                                    {userNome ? userNome[0].toUpperCase() : 'U'}
                                </span>
                            </div>
                        )}
                    </Link>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default function DashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ paroquiaSlug: string }> }) {
    const pathname = usePathname()
    const segments = pathname.split('/')
    const slug = segments[1] || ''

    // The /entrar page should NOT use the dashboard layout
    if (pathname.includes('/entrar')) {
        return <>{children}</>
    }

    return (
        <ParoquiaProvider slug={slug}>
            <DashboardContent slug={slug}>
                {children}
            </DashboardContent>
        </ParoquiaProvider>
    )
}
