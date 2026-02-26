import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const paroquiaId = request.nextUrl.searchParams.get('paroquia_id')
    if (!paroquiaId) return NextResponse.json({ error: 'paroquia_id obrigatório' }, { status: 400 })

    const serviceClient = await createServiceClient()

    const { data: membro, error } = await serviceClient
        .from('membros_paroquia')
        .select('role, status')
        .eq('paroquia_id', paroquiaId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (!membro) {
        return NextResponse.json({ role: null, isMember: false })
    }

    return NextResponse.json({
        role: membro.role,
        isMember: true,
        isAdmin: membro.role === 'paroquia_admin' || membro.role === 'super_admin',
        isPadre: membro.role === 'padre',
        isSecretaria: membro.role === 'secretaria',
        isCoordenador: membro.role === 'coordenador',
        isOperadorPdv: membro.role === 'operador_pdv',
        isMembro: membro.role === 'membro',
    })
}
