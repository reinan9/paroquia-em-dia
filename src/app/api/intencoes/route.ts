import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const paroquiaId = request.nextUrl.searchParams.get('paroquia_id')
    const dataMissa = request.nextUrl.searchParams.get('data_missa')
    const status = request.nextUrl.searchParams.get('status')
    const showMine = request.nextUrl.searchParams.get('mine') === 'true'

    if (!paroquiaId) return NextResponse.json({ error: 'paroquia_id obrigatório' }, { status: 400 })

    const serviceClient = await createServiceClient()

    let query = serviceClient
        .from('intencoes_missa')
        .select('*')
        .eq('paroquia_id', paroquiaId)
        .order('data_missa', { ascending: true })
        .order('created_at', { ascending: false })

    if (showMine) {
        // Fiel: only their own intentions
        query = query.eq('user_id', user.id)
    } else {
        if (dataMissa) query = query.eq('data_missa', dataMissa)
        if (status) query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { paroquia_id, solicitante_nome, intencao, tipo, data_missa, horario_missa } = body

    if (!paroquia_id || !solicitante_nome || !intencao) {
        return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    const { data, error } = await serviceClient
        .from('intencoes_missa')
        .insert({
            paroquia_id,
            user_id: user.id,
            solicitante_nome,
            intencao,
            tipo: tipo || 'falecido',
            data_missa: data_missa || null,
            horario_missa: horario_missa || null,
            status: 'pendente',
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}

export async function PUT(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { id, status: newStatus, observacao } = body

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const serviceClient = await createServiceClient()

    const updates: Record<string, string> = {}
    if (newStatus) updates.status = newStatus
    if (observacao !== undefined) updates.observacao = observacao

    const { data, error } = await serviceClient
        .from('intencoes_missa')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function DELETE(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { id } = body

    const serviceClient = await createServiceClient()

    const { error } = await serviceClient.from('intencoes_missa').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
