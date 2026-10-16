import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { SERVICE_CATEGORIES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const DEFAULT_EXPRESS_SHIPPING = 3990
const DEFAULT_DELIVERY_TIMEFRAME = '24h hábiles en Rancagua y Machalí • 24 a 48h en RM • 2 a 4 días a Regiones'
const DEFAULT_ORIGIN = 'Almarza 552, Rancagua, Chile'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .in('key_name', ['artist_services', 'express_shipping_cost', 'delivery_timeframe'])

    let services = SERVICE_CATEGORIES
    let expressShippingCost = DEFAULT_EXPRESS_SHIPPING
    let deliveryTimeframe = DEFAULT_DELIVERY_TIMEFRAME

    if (!error && data && data.length > 0) {
      const servicesRow = data.find(r => r.key_name === 'artist_services')
      if (servicesRow?.value) {
        try {
          const parsed = JSON.parse(servicesRow.value)
          if (Array.isArray(parsed) && parsed.length > 0) {
            services = parsed
          }
        } catch (e) {
          console.warn('Error parsing artist_services JSON:', e)
        }
      }

      const shippingRow = data.find(r => r.key_name === 'express_shipping_cost')
      if (shippingRow?.value) {
        const parsedCost = parseInt(shippingRow.value, 10)
        if (!isNaN(parsedCost)) {
          expressShippingCost = parsedCost
        }
      }

      const timeframeRow = data.find(r => r.key_name === 'delivery_timeframe')
      if (timeframeRow?.value) {
        deliveryTimeframe = timeframeRow.value
      }
    }

    return NextResponse.json({
      success: true,
      services,
      expressShippingCost,
      deliveryTimeframe,
      deliveryOrigin: DEFAULT_ORIGIN
    })
  } catch (err) {
    console.error('Error fetching services config:', err)
    return NextResponse.json({
      success: true,
      services: SERVICE_CATEGORIES,
      expressShippingCost: DEFAULT_EXPRESS_SHIPPING,
      deliveryTimeframe: DEFAULT_DELIVERY_TIMEFRAME,
      deliveryOrigin: DEFAULT_ORIGIN,
      fallback: true
    })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { services, expressShippingCost, deliveryTimeframe } = body

    const supabase = createServerClient()
    const now = new Date().toISOString()
    const upsertRows = []

    if (services !== undefined) {
      upsertRows.push({
        section: 'Servicios',
        key_name: 'artist_services',
        value: JSON.stringify(services),
        updated_at: now
      })
    }

    if (expressShippingCost !== undefined) {
      upsertRows.push({
        section: 'Tienda & Envíos',
        key_name: 'express_shipping_cost',
        value: String(expressShippingCost),
        updated_at: now
      })
    }

    if (deliveryTimeframe !== undefined) {
      upsertRows.push({
        section: 'Tienda & Envíos',
        key_name: 'delivery_timeframe',
        value: String(deliveryTimeframe),
        updated_at: now
      })
    }

    if (upsertRows.length > 0) {
      const { error } = await supabase
        .from('site_config')
        .upsert(upsertRows, { onConflict: 'key_name' })

      if (error) {
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Servicios y tarifas guardados exitosamente',
      expressShippingCost: parseInt(expressShippingCost, 10) || DEFAULT_EXPRESS_SHIPPING
    })
  } catch (err) {
    console.error('Error updating services config:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Error al guardar los servicios y tarifas' },
      { status: 500 }
    )
  }
}
