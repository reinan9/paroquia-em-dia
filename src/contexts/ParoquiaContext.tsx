'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Paroquia {
    id: string
    nome: string
    slug: string
    endereco: string | null
    cidade: string | null
    estado: string | null
    telefone: string | null
    email: string | null
    logo_url: string | null
    cor_primaria: string | null
    pix_chave: string | null
    pix_recebedor: string | null
    status: string
}

interface ParoquiaContextType {
    paroquia: Paroquia | null
    paroquiaId: string
    loading: boolean
    error: string | null
    refresh: () => void
}

const ParoquiaContext = createContext<ParoquiaContextType>({
    paroquia: null,
    paroquiaId: '',
    loading: true,
    error: null,
    refresh: () => { },
})

export function ParoquiaProvider({ slug, children }: { slug: string; children: ReactNode }) {
    const [paroquia, setParoquia] = useState<Paroquia | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function fetchParoquia() {
        try {
            setLoading(true)
            const res = await fetch(`/api/paroquias/slug?slug=${slug}`)
            if (!res.ok) throw new Error('Paróquia não encontrada')
            const data = await res.json()
            setParoquia(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar paróquia')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (slug) fetchParoquia()
    }, [slug])

    return (
        <ParoquiaContext.Provider value={{
            paroquia,
            paroquiaId: paroquia?.id || '',
            loading,
            error,
            refresh: fetchParoquia,
        }}>
            {children}
        </ParoquiaContext.Provider>
    )
}

export function useParoquia() {
    return useContext(ParoquiaContext)
}
