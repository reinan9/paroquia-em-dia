import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const paroquiaId = request.nextUrl.searchParams.get('paroquia_id')
    if (!paroquiaId) {
        return NextResponse.json({ error: 'paroquia_id é obrigatório' }, { status: 400 })
    }

    const { data, error } = await (await createServiceClient())
        .from('avisos')
        .select('*')
        .eq('paroquia_id', paroquiaId)
        .order('created_at', { ascending: false })

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
    const { paroquia_id, titulo, conteudo, imagem_url, publicado } = body

    if (!paroquia_id || !titulo || !conteudo) {
        return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const { data, error } = await (await createServiceClient())
        .from('avisos')
        .insert({
            paroquia_id,
            titulo,
            conteudo,
            imagem_url,
            publicado: publicado ?? false,
            autor_id: user.id,
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
}

export async function PUT(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
        return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const { data, error } = await (await createServiceClient())
        .from('avisos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function DELETE(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    const { error } = await (await createServiceClient())
        .from('avisos')
        .delete()
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
