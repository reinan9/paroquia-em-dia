import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
    const body = await request.json()
    const { nome, email, password } = body

    if (!nome || !email || !password) {
        return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    if (password.length < 6) {
        return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // Create user via admin API (bypasses triggers)
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome },
    })

    if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Create profile manually
    const { error: profileError } = await serviceClient
        .from('profiles')
        .insert({
            id: authData.user.id,
            nome,
        })

    if (profileError) {
        // Rollback: delete the auth user if profile creation fails
        await serviceClient.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ user: { id: authData.user.id, email } }, { status: 201 })
}
