import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET user profile for current parish
export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const paroquiaId = request.nextUrl.searchParams.get('paroquia_id')
    if (!paroquiaId) return NextResponse.json({ error: 'paroquia_id obrigatório' }, { status: 400 })

    const serviceClient = await createServiceClient()

    const { data, error } = await serviceClient
        .from('membros_paroquia')
        .select('id, nome, telefone, endereco, foto_url, role, created_at')
        .eq('paroquia_id', paroquiaId)
        .eq('user_id', user.id)
        .single()

    if (error) {
        // Fallback: try select * if new columns don't exist yet
        const { data: fallback, error: fallbackErr } = await serviceClient
            .from('membros_paroquia')
            .select('*')
            .eq('paroquia_id', paroquiaId)
            .eq('user_id', user.id)
            .single()
        if (fallbackErr) return NextResponse.json({ error: fallbackErr.message }, { status: 500 })
        return NextResponse.json({ ...fallback, email: user.email })
    }

    return NextResponse.json({ ...data, email: user.email })
}

// UPDATE user profile
export async function PUT(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { paroquia_id, nome, telefone, endereco, foto_url } = body

    if (!paroquia_id) return NextResponse.json({ error: 'paroquia_id obrigatório' }, { status: 400 })

    const serviceClient = await createServiceClient()

    const updates: Record<string, string | null> = {}
    if (nome !== undefined) updates.nome = nome
    if (telefone !== undefined) updates.telefone = telefone
    if (endereco !== undefined) updates.endereco = endereco
    if (foto_url !== undefined) updates.foto_url = foto_url

    const { data, error } = await serviceClient
        .from('membros_paroquia')
        .update(updates)
        .eq('paroquia_id', paroquia_id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
