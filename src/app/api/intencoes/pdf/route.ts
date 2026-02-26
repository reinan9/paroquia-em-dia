import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const paroquiaId = request.nextUrl.searchParams.get('paroquia_id')
    const dataMissa = request.nextUrl.searchParams.get('data_missa')

    if (!paroquiaId || !dataMissa) {
        return NextResponse.json({ error: 'paroquia_id e data_missa obrigatórios' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // Get parish info
    const { data: paroquia } = await serviceClient
        .from('paroquias')
        .select('nome, cidade, estado')
        .eq('id', paroquiaId)
        .single()

    // Get approved intentions for this date
    const { data: intencoes, error } = await serviceClient
        .from('intencoes_missa')
        .select('*')
        .eq('paroquia_id', paroquiaId)
        .eq('data_missa', dataMissa)
        .eq('status', 'aprovado')
        .order('tipo', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Format date
    const dataFormatada = new Date(dataMissa + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })

    // Get horarios
    const horarios = [...new Set(intencoes?.map(i => i.horario_missa).filter(Boolean))]

    const tipoLabels: Record<string, string> = {
        falecido: '🕊️ Falecido(a)',
        vivo: '🙏 Vivo(a)',
        acao_gracas: '🙌 Ação de Graças',
        outro: '📝 Outra Intenção',
    }

    // Generate HTML
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Intenções de Missa - ${dataFormatada}</title>
    <style>
        @page { margin: 2cm; size: A4; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 20px; color: #2563eb; margin-bottom: 4px; }
        .header h2 { font-size: 16px; color: #333; font-weight: normal; }
        .header .date { font-size: 14px; color: #666; margin-top: 8px; }
        .header .horarios { font-size: 13px; color: #888; margin-top: 4px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 14px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 10px; }
        .intencao { padding: 8px 0; border-bottom: 1px dotted #e5e7eb; font-size: 13px; }
        .intencao:last-child { border-bottom: none; }
        .intencao .nome { font-weight: bold; }
        .intencao .solicitante { color: #666; font-size: 12px; }
        .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        .empty { text-align: center; color: #999; padding: 20px; font-style: italic; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>${paroquia?.nome || 'Paróquia'}</h1>
        <h2>${paroquia?.cidade || ''}${paroquia?.estado ? ' - ' + paroquia.estado : ''}</h2>
        <div class="date">Intenções de Missa — ${dataFormatada}</div>
        ${horarios.length > 0 ? `<div class="horarios">Horários: ${horarios.join(' | ')}</div>` : ''}
    </div>

    ${intencoes && intencoes.length > 0 ? `
        ${['falecido', 'vivo', 'acao_gracas', 'outro'].map(tipo => {
        const items = intencoes.filter(i => i.tipo === tipo)
        if (items.length === 0) return ''
        return `
            <div class="section">
                <div class="section-title">${tipoLabels[tipo] || tipo}</div>
                ${items.map(i => `
                    <div class="intencao">
                        <span class="nome">${i.intencao}</span>
                        <span class="solicitante"> — Solicitado por: ${i.solicitante_nome}</span>
                    </div>
                `).join('')}
            </div>
            `
    }).join('')}
    ` : '<div class="empty">Nenhuma intenção aprovada para esta data.</div>'}

    <div class="footer">
        Paróquia em Dia — Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </div>
</body>
</html>`

    return new NextResponse(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
        },
    })
}
