import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const db = await createServiceClient()
    const paroquiaId = request.nextUrl.searchParams.get('paroquia_id')
    if (!paroquiaId) return NextResponse.json({ error: 'paroquia_id obrigatório' }, { status: 400 })

    const showAll = request.nextUrl.searchParams.get('all') === 'true'
    const showMine = request.nextUrl.searchParams.get('mine') === 'true'

    let query = supabase
        .from('pedidos_oracao')
        .select('*')
        .eq('paroquia_id', paroquiaId)
        .order('created_at', { ascending: false })

    if (showMine) {
        query = query.eq('user_id', user.id)
    } else if (!showAll) {
        query = query.or(`status.eq.aprovado,user_id.eq.${user.id}`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const db = await createServiceClient()
    const body = await request.json()
    const { paroquia_id, nome_solicitante, intencao } = body

    if (!paroquia_id || !nome_solicitante || !intencao) {
        return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })
    }

    const { data, error } = await (await createServiceClient())
        .from('pedidos_oracao')
        .insert({ paroquia_id, user_id: user.id, nome_solicitante, intencao })
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
    const { id, status } = body

    if (!id || !status) return NextResponse.json({ error: 'ID e status obrigatórios' }, { status: 400 })

    const { data, error } = await (await createServiceClient())
        .from('pedidos_oracao')
        .update({ status, moderado_por: user.id })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
