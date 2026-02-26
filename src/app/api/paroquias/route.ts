import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const serviceClient = await createServiceClient()

    const { data, error } = await serviceClient
        .from('paroquias')
        .select(`
      *,
      membros_paroquia!inner(role, status)
    `)
        .eq('membros_paroquia.user_id', user.id)
        .eq('membros_paroquia.status', 'active')

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, endereco, cidade, estado, telefone, email } = body

    if (!nome) {
        return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Create slug
    const slug = nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

    const serviceClient = await createServiceClient()

    // Create paroquia
    const { data: paroquia, error: paroquiaError } = await serviceClient
        .from('paroquias')
        .insert({
            nome,
            slug,
            endereco,
            cidade,
            estado: estado || 'AL',
            telefone,
            email,
            criado_por: user.id,
            status: 'active',
        })
        .select()
        .single()

    if (paroquiaError) {
        return NextResponse.json({ error: paroquiaError.message }, { status: 500 })
    }

    // Add creator as admin
    const { error: membroError } = await serviceClient
        .from('membros_paroquia')
        .insert({
            paroquia_id: paroquia.id,
            user_id: user.id,
            role: 'paroquia_admin',
            status: 'active',
        })

    if (membroError) {
        return NextResponse.json({ error: membroError.message }, { status: 500 })
    }

    return NextResponse.json(paroquia, { status: 201 })
}
