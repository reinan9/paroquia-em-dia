export type Role = 'super_admin' | 'paroquia_admin' | 'secretaria' | 'coordenador' | 'membro' | 'operador_pdv'

const roleHierarchy: Record<Role, number> = {
    super_admin: 100,
    paroquia_admin: 80,
    secretaria: 60,
    coordenador: 40,
    operador_pdv: 20,
    membro: 10,
}

export function hasMinRole(userRole: Role, requiredRole: Role): boolean {
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function canManage(role: Role): boolean {
    return hasMinRole(role, 'secretaria')
}

export function canAdmin(role: Role): boolean {
    return hasMinRole(role, 'paroquia_admin')
}

export function isOperador(role: Role): boolean {
    return role === 'operador_pdv' || hasMinRole(role, 'secretaria')
}

export interface UserMembership {
    paroquia_id: string
    role: Role
    paroquia_nome: string
    paroquia_slug: string
    paroquia_status: string
}

export function filterNavItems(role: Role) {
    const items = [
        { href: 'home', label: 'Início', icon: 'Home', minRole: 'membro' as Role },
        { href: 'avisos', label: 'Avisos', icon: 'Megaphone', minRole: 'membro' as Role },
        { href: 'agenda', label: 'Agenda', icon: 'Calendar', minRole: 'membro' as Role },
        { href: 'pastorais', label: 'Pastorais', icon: 'Users', minRole: 'membro' as Role },
        { href: 'oracao', label: 'Oração', icon: 'Heart', minRole: 'membro' as Role },
        { href: 'dizimo', label: 'Dízimo', icon: 'Wallet', minRole: 'membro' as Role },
        { href: 'eventos', label: 'Eventos', icon: 'PartyPopper', minRole: 'secretaria' as Role },
        { href: 'pdv', label: 'PDV', icon: 'ShoppingCart', minRole: 'operador_pdv' as Role },
        { href: 'admin', label: 'Admin', icon: 'Settings', minRole: 'paroquia_admin' as Role },
    ]

    return items.filter((item) => hasMinRole(role, item.minRole))
}
