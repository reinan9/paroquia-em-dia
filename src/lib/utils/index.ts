import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)
}

export function formatDate(dateStr: string): string {
    return format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function formatDateShort(dateStr: string): string {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(dateStr: string): string {
    return format(parseISO(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatRelative(dateStr: string): string {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: ptBR })
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}


