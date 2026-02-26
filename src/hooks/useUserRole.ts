'use client'

import { useState, useEffect } from 'react'

interface UserRole {
    role: string | null
    isMember: boolean
    isAdmin: boolean
    isPadre: boolean
    isSecretaria: boolean
    isCoordenador: boolean
    isOperadorPdv: boolean
    isMembro: boolean
    loading: boolean
}

export function useUserRole(paroquiaId: string): UserRole {
    const [data, setData] = useState<UserRole>({
        role: null,
        isMember: false,
        isAdmin: false,
        isPadre: false,
        isSecretaria: false,
        isCoordenador: false,
        isOperadorPdv: false,
        isMembro: false,
        loading: true,
    })

    useEffect(() => {
        if (!paroquiaId) {
            // Keep loading=true until we have a paroquiaId to fetch with
            return
        }

        fetch(`/api/auth/role?paroquia_id=${paroquiaId}`)
            .then(res => res.json())
            .then(result => {
                setData({
                    role: result.role || null,
                    isMember: result.isMember || false,
                    isAdmin: result.isAdmin || false,
                    isPadre: result.isPadre || false,
                    isSecretaria: result.isSecretaria || false,
                    isCoordenador: result.isCoordenador || false,
                    isOperadorPdv: result.isOperadorPdv || false,
                    isMembro: result.isMembro || false,
                    loading: false,
                })
            })
            .catch(() => {
                setData(prev => ({ ...prev, loading: false }))
            })
    }, [paroquiaId])

    return data
}
