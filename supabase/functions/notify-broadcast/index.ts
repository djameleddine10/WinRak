import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_URL = 'https://exp.host/--/api/v2/push/send'
const CHUNK    = 100

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // ── 1. Verify caller is an admin ────────────────────────────────────────
    const auth = req.headers.get('Authorization') ?? ''
    if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    )
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser()
    if (userErr || !user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })

    const { data: prof } = await supabaseUser
      .from('profiles').select('role').eq('id', user.id).single()
    if (prof?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403, headers: CORS })

    // ── 2. Parse & validate payload ─────────────────────────────────────────
    const { target, title, body, data: extra } = await req.json()
    if (!target || !title || !body) {
      return Response.json({ error: 'target, title, body are required' }, { status: 400, headers: CORS })
    }

    // ── 3. Service-role client (bypasses RLS) ───────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── 4. Collect push tokens by target ────────────────────────────────────
    type Row = { user_id: string; push_token: string }
    let rows: Row[] = []

    if (target === 'all') {
      const { data } = await supabase
        .from('profiles').select('id, push_token').not('push_token', 'is', null)
      rows = (data ?? []).map((p: any) => ({ user_id: p.id, push_token: p.push_token }))

    } else if (target === 'drivers') {
      // profiles that have a matching row in drivers
      const { data } = await supabase
        .from('profiles')
        .select('id, push_token, drivers!inner(id)')
        .not('push_token', 'is', null)
      rows = (data ?? []).map((p: any) => ({ user_id: p.id, push_token: p.push_token }))

    } else if (target === 'passengers') {
      const { data } = await supabase
        .from('profiles')
        .select('id, push_token, passengers!inner(id)')
        .not('push_token', 'is', null)
      rows = (data ?? []).map((p: any) => ({ user_id: p.id, push_token: p.push_token }))
    }

    // ── 5. Send to Expo Push API in chunks of 100 ───────────────────────────
    let sent   = 0
    const errs: unknown[] = []

    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK)
      const messages = chunk.map(r => ({
        to:    r.push_token,
        title,
        body,
        sound: 'default',
        data:  extra ?? {},
      }))

      const res  = await fetch(EXPO_URL, {
        method:  'POST',
        headers: {
          'Accept':           'application/json',
          'Accept-Encoding':  'gzip, deflate',
          'Content-Type':     'application/json',
        },
        body: JSON.stringify(messages),
      })
      const json = await res.json()

      for (const ticket of (json.data ?? [])) {
        if (ticket.status === 'ok') sent++
        else errs.push(ticket)
      }
    }

    // ── 6. Insert in-app notifications (mobile inbox) ───────────────────────
    for (let i = 0; i < rows.length; i += 500) {
      await supabase.from('notifications').insert(
        rows.slice(i, i + 500).map(r => ({
          user_id: r.user_id,
          type:    'admin',
          title,
          body,
        }))
      )
    }

    // ── 7. Log the broadcast in admin_notifications ─────────────────────────
    const status =
      rows.length === 0  ? 'no_tokens' :
      errs.length === 0  ? 'sent'      : 'partial'

    await supabase.from('admin_notifications').insert({
      target, title, body,
      data:       extra ?? null,
      sent_count: sent,
      status,
    })

    return Response.json(
      { sent, total: rows.length, errors: errs.slice(0, 5) },
      { headers: CORS },
    )
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500, headers: CORS })
  }
})
