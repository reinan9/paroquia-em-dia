import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'avatars'

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

    // Validate file type
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Apenas imagens são permitidas' }, { status: 400 })
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Imagem deve ter no máximo 2MB' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}-${Date.now()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { data, error } = await serviceClient.storage
        .from(bucket)
        .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
        })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Get public URL
    const { data: urlData } = serviceClient.storage
        .from(bucket)
        .getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
}
