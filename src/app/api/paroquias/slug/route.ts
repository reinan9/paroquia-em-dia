import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Get paroquia by slug (public - needed for /entrar page)
export async function GET(request: NextRequest) {

    const slug = request.nextUrl.searchParams.get('slug')
    if (!slug) {
        return NextResponse.json({ error: 'slug é obrigatório' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    const { data, error } = await serviceClient
        .from('paroquias')
        .select('id, nome, slug, endereco, cidade, estado, telefone, email, status, cor_primaria, logo_url, pix_chave, pix_recebedor')
        .eq('slug', slug)
        .single()

    if (error) {
        // If explicit columns fail, fall back to select all
        console.log('Paroquia GET error (explicit cols):', error.message)
        const { data: fallbackData, error: fallbackError } = await serviceClient
            .from('paroquias')
            .select('*')
            .eq('slug', slug)
            .single()
        if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 })
        return NextResponse.json(fallbackData)
    }

    return NextResponse.json(data)
}

// Update paroquia by id
export async function PUT(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...rawUpdates } = body

    if (!id) {
        return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // Only include known columns to avoid errors with missing columns
    const allowedFields = ['nome', 'endereco', 'cidade', 'estado', 'telefone', 'email', 'cor_primaria', 'logo_url', 'pix_chave', 'pix_recebedor']
    const updates: Record<string, string> = {}
    for (const key of allowedFields) {
        if (key in rawUpdates) updates[key] = rawUpdates[key]
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    const { data, error } = await serviceClient
        .from('paroquias')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
