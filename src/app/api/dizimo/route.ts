import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Get tithe data (dizimista, plano, parcelas)
export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const paroquiaId = request.nextUrl.searchParams.get('paroquia_id')
    const action = request.nextUrl.searchParams.get('action')

    if (!paroquiaId) return NextResponse.json({ error: 'paroquia_id obrigatório' }, { status: 400 })

    const serviceClient = await createServiceClient()

    // Admin: list dizimistas with PRIVACY - NO individual values
    if (action === 'admin') {
        // Check if user has admin role
        const { data: membro } = await serviceClient
            .from('membros_paroquia')
            .select('role')
            .eq('paroquia_id', paroquiaId)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle()

        const isAdmin = membro?.role === 'paroquia_admin' || membro?.role === 'super_admin'

        const { data: dizimistas, error } = await serviceClient
            .from('dizimistas')
            .select(`
                id,
                nome,
                dizimo_planos(
                    id,
                    ativo,
                    dizimo_parcelas(id, status)
                )
            `)
            .eq('paroquia_id', paroquiaId)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Calculate aggregated totals from parcelas (without returning individual values)
        const { data: totalData } = await serviceClient
            .from('dizimo_parcelas')
            .select('valor, status')
            .eq('paroquia_id', paroquiaId)

        const totals = {
            total_arrecadado: totalData?.filter(p => p.status === 'paga').reduce((sum, p) => sum + Number(p.valor), 0) || 0,
            total_parcelas: totalData?.length || 0,
            parcelas_pagas: totalData?.filter(p => p.status === 'paga').length || 0,
            parcelas_vencidas: totalData?.filter(p => p.status === 'vencida').length || 0,
        }

        // Transform data to show only status info, NOT values
        const formattedDizimistas = dizimistas?.map(d => {
            const allParcelas = d.dizimo_planos?.flatMap((p: { dizimo_parcelas: { id: string; status: string }[] }) => p.dizimo_parcelas) || []
            const pagas = allParcelas.filter((p: { status: string }) => p.status === 'paga').length
            const vencidas = allParcelas.filter((p: { status: string }) => p.status === 'vencida').length
            const abertas = allParcelas.filter((p: { status: string }) => p.status === 'aberta').length

            return {
                id: d.id,
                nome: d.nome,
                total_planos: d.dizimo_planos?.length || 0,
                parcelas_pagas: pagas,
                parcelas_vencidas: vencidas,
                parcelas_abertas: abertas,
                status: vencidas > 0 ? 'inadimplente' : 'em_dia',
            }
        }) || []

        return NextResponse.json({
            dizimistas: formattedDizimistas,
            totals,
        })
    }

    // User: own tithe data (full access to own data)
    const { data: dizimista, error: dizError } = await serviceClient
        .from('dizimistas')
        .select(`
            *,
            dizimo_planos(*, dizimo_parcelas(*))
        `)
        .eq('paroquia_id', paroquiaId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (dizError) return NextResponse.json({ error: dizError.message }, { status: 500 })
    return NextResponse.json(dizimista)
}

// Create dizimista + plano or pay parcela
export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const serviceClient = await createServiceClient()
    const body = await request.json()
    const { action, paroquia_id, valor_mensal, dia_vencimento, parcela_id } = body

    if (action === 'criar_plano') {
        // Create dizimista if not exists
        let { data: dizimista } = await serviceClient
            .from('dizimistas')
            .select('id')
            .eq('paroquia_id', paroquia_id)
            .eq('user_id', user.id)
            .maybeSingle()

        if (!dizimista) {
            const { data: profile } = await serviceClient.from('profiles').select('nome').eq('id', user.id).single()
            const { data: newDiz, error: err } = await serviceClient
                .from('dizimistas')
                .insert({ paroquia_id, user_id: user.id, nome: profile?.nome || 'Dizimista' })
                .select()
                .single()
            if (err) return NextResponse.json({ error: err.message }, { status: 500 })
            dizimista = newDiz
        }

        // Create plano
        const { data: plano, error: planoErr } = await serviceClient
            .from('dizimo_planos')
            .insert({ dizimista_id: dizimista!.id, paroquia_id, valor_mensal, dia_vencimento })
            .select()
            .single()

        if (planoErr) return NextResponse.json({ error: planoErr.message }, { status: 500 })

        // Generate parcelas for next 12 months
        const parcelas = []
        const now = new Date()
        for (let i = 0; i < 12; i++) {
            const competencia = new Date(now.getFullYear(), now.getMonth() + i, 1)
            const vencimento = new Date(now.getFullYear(), now.getMonth() + i, dia_vencimento)
            parcelas.push({
                plano_id: plano.id,
                paroquia_id,
                competencia: competencia.toISOString().split('T')[0],
                vencimento: vencimento.toISOString().split('T')[0],
                valor: valor_mensal,
                status: 'aberta',
            })
        }

        const { error: parcelasErr } = await serviceClient.from('dizimo_parcelas').insert(parcelas)
        if (parcelasErr) return NextResponse.json({ error: parcelasErr.message }, { status: 500 })

        return NextResponse.json(plano, { status: 201 })
    }

    if (action === 'confirmar_pagamento' && parcela_id) {
        const { data, error } = await serviceClient
            .from('dizimo_parcelas')
            .update({ status: 'paga' })
            .eq('id', parcela_id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
