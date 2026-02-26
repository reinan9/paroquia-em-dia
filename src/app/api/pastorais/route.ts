import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const db = await createServiceClient()
    const paroquiaId = request.nextUrl.searchParams.get('paroquia_id')
    if (!paroquiaId) return NextResponse.json({ error: 'paroquia_id obrigatório' }, { status: 400 })

    const { data, error } = await (await createServiceClient())
        .from('pastorais')
        .select('*, pastoral_membros(count)')
        .eq('paroquia_id', paroquiaId)
        .order('nome')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const db = await createServiceClient()
    const body = await request.json()
    const { paroquia_id, nome, descricao, coordenador_id, dia_reuniao, horario_reuniao } = body

    if (!paroquia_id || !nome) return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })

    const { data, error } = await (await createServiceClient())
        .from('pastorais')
        .insert({ paroquia_id, nome, descricao, coordenador_id, dia_reuniao, horario_reuniao })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}

export async function PUT(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const db = await createServiceClient()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const { data, error } = await (await createServiceClient()).from('pastorais').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function DELETE(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const db = await createServiceClient()
    const { id } = await request.json()
    const { error } = await (await createServiceClient()).from('pastorais').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
