// Supabase Edge Function — notify-driver
// Triggered by a Database Webhook on: INSERT INTO trip_offers
// Sends an Expo push notification to the driver when the app is killed/backgrounded.
//
// Setup in Supabase dashboard:
//   Database → Webhooks → Create webhook
//   Table: trip_offers  |  Event: INSERT
//   URL: https://<project-ref>.supabase.co/functions/v1/notify-driver
//   HTTP headers: { "Authorization": "Bearer <anon-key>" }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req: Request) => {
  try {
    const payload = await req.json()
    // Webhook payload shape: { type: 'INSERT', table: 'trip_offers', record: {...} }
    const record = payload.record as {
      id:        string
      trip_id:   string
      driver_id: string
    }

    if (!record?.driver_id || !record?.trip_id) {
      return new Response('missing fields', { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get driver's Expo push token
    const { data: driver, error: driverErr } = await supabase
      .from('drivers')
      .select('push_token')
      .eq('id', record.driver_id)
      .maybeSingle()

    if (driverErr || !driver?.push_token) {
      // No token saved yet — driver is using local notifications only (app open)
      return new Response('no push token', { status: 200 })
    }

    // Get trip details for the notification body
    const { data: trip } = await supabase
      .from('trips')
      .select('from_address, to_address, price')
      .eq('id', record.trip_id)
      .maybeSingle()

    if (!trip) {
      return new Response('trip not found', { status: 200 })
    }

    // Send via Expo Push API
    const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        to:       driver.push_token,
        title:    'طلب رحلة جديد 🚗',
        body:     `${trip.from_address} ← ${trip.to_address}\n${trip.price?.toLocaleString('en-US')} دج`,
        sound:    'default',
        priority: 'high',
        data:     { tripId: record.trip_id, offerId: record.id },
      }),
    })

    const result = await pushRes.json()
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status:  200,
    })
  } catch (err) {
    console.error('[notify-driver]', err)
    return new Response('error', { status: 500 })
  }
})
