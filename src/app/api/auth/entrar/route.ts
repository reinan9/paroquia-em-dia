import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const body = await request.json()
    const { nome, email, password, paroquia_id } = body

    if (!nome || !email || !password || !paroquia_id) {
        return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    if (password.length < 6) {
        return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // Verify parish exists
    const { data: paroquia, error: paroquiaError } = await serviceClient
        .from('paroquias')
        .select('id, nome')
        .eq('id', paroquia_id)
        .single()

    if (paroquiaError || !paroquia) {
        return NextResponse.json({ error: 'Paróquia não encontrada' }, { status: 404 })
    }

    // Create user via admin API
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome },
    })

    if (authError) {
        // If user already exists, try to just add as member
        if (authError.message.includes('already') || authError.message.includes('duplicate')) {
            return NextResponse.json({ error: 'Este e-mail já está cadastrado. Faça login em /login' }, { status: 409 })
        }
        return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Create profile
    const { error: profileError } = await serviceClient
        .from('profiles')
        .insert({ id: authData.user.id, nome })

    if (profileError) {
        await serviceClient.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Add user as membro of the parish
    const { error: membroError } = await serviceClient
        .from('membros_paroquia')
        .insert({
            paroquia_id,
            user_id: authData.user.id,
            role: 'membro',
            status: 'active',
        })

    if (membroError) {
        return NextResponse.json({ error: membroError.message }, { status: 500 })
    }

    return NextResponse.json({
        user: { id: authData.user.id, email },
        paroquia: { id: paroquia.id, nome: paroquia.nome },
    }, { status: 201 })
}
