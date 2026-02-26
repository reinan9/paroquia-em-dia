import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Get PDV data
export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const db = await createServiceClient()
    const paroquiaId = request.nextUrl.searchParams.get('paroquia_id')
    const eventoId = request.nextUrl.searchParams.get('evento_id')
    const pontoVendaId = request.nextUrl.searchParams.get('ponto_venda_id')

    if (!paroquiaId) return NextResponse.json({ error: 'paroquia_id obrigatório' }, { status: 400 })

    // Get pontos de venda for an event
    if (eventoId && !pontoVendaId) {
        const { data, error } = await (await createServiceClient())
        .from('eventos_pontos_venda')
            .select('*, eventos_produtos(*)')
            .eq('evento_id', eventoId)
            .eq('paroquia_id', paroquiaId)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    }

    // Get orders for a ponto de venda
    if (pontoVendaId) {
        const { data, error } = await (await createServiceClient())
        .from('eventos_pedidos')
            .select('*, eventos_pedido_itens(*, eventos_produtos(nome))')
            .eq('ponto_venda_id', pontoVendaId)
            .order('created_at', { ascending: false })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    }

    // Get sales events
    const { data, error } = await (await createServiceClient())
        .from('eventos')
        .select('*')
        .eq('paroquia_id', paroquiaId)
        .eq('tem_vendas', true)
        .order('data_inicio', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// Create order / manage PDV
export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const db = await createServiceClient()
    const body = await request.json()
    const { action } = body

    if (action === 'criar_pedido') {
        const { ponto_venda_id, paroquia_id, comprador_nome, itens } = body

        // Create order
        const { data: pedido, error: pedidoErr } = await (await createServiceClient())
        .from('eventos_pedidos')
            .insert({
                ponto_venda_id,
                paroquia_id,
                comprador_nome: comprador_nome || 'Cliente',
                operador_id: user.id,
                status: 'aberto',
            })
            .select()
            .single()

        if (pedidoErr) return NextResponse.json({ error: pedidoErr.message }, { status: 500 })

        // Add items
        if (itens && itens.length > 0) {
            const orderItems = itens.map((item: { produto_id: string; quantidade: number; preco_unitario: number }) => ({
                pedido_id: pedido.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                subtotal: item.quantidade * item.preco_unitario,
            }))

            const { error: itensErr } = await (await createServiceClient()).from('eventos_pedido_itens').insert(orderItems)
            if (itensErr) return NextResponse.json({ error: itensErr.message }, { status: 500 })
        }

        return NextResponse.json(pedido, { status: 201 })
    }

    if (action === 'pagar_pedido') {
        const { pedido_id, metodo_pagamento } = body

        const { data, error } = await (await createServiceClient())
        .from('eventos_pedidos')
            .update({ status: 'pago', metodo_pagamento })
            .eq('id', pedido_id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    }

    if (action === 'entregar_pedido') {
        const { pedido_id } = body

        const { data, error } = await (await createServiceClient())
        .from('eventos_pedidos')
            .update({ status: 'entregue' })
            .eq('id', pedido_id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
