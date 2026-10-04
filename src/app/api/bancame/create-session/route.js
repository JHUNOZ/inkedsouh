import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      amount, 
      orderNumber, 
      customer = {}, 
      items = [], 
      deliveryType = 'santiago',
      deliveryAddress = '',
      deliveryCity = 'Santiago',
      deliveryNotes = '',
      deliveryTimeframe = '24 a 48 horas hábiles en RM y 2 a 4 días hábiles a Regiones'
    } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'El monto de la orden debe ser mayor a 0 CLP.' }, 
        { status: 400 }
      )
    }

    const orderNum = orderNumber || `INK-${Math.floor(100000 + Math.random() * 900000)}`
    const supabase = createServerClient()

    // 1. Registrar o actualizar orden en base de datos Supabase
    const orderRecord = {
      order_number: orderNum,
      customer_name: customer.name || 'Cliente Web',
      customer_email: customer.email || null,
      customer_phone: customer.phone || null,
      delivery_type: deliveryType,
      delivery_address: deliveryAddress,
      delivery_city: deliveryCity,
      delivery_notes: deliveryNotes,
      delivery_timeframe: deliveryTimeframe,
      total_amount: Math.round(amount),
      currency: 'CLP',
      payment_method: 'bancame',
      payment_status: 'pendiente',
      status: 'pendiente_pago',
      items: items,
      created_at: new Date().toISOString()
    }

    try {
      await supabase.from('orders').upsert([orderRecord], { onConflict: 'order_number' })
    } catch (dbErr) {
      console.warn('[Banca.me Session] Aviso al guardar orden en BD:', dbErr?.message)
    }

    // 2. Verificar credenciales de Banca.me
    const secretKey = process.env.BANCAME_SECRET_KEY
    const isRealKeyConfigured = secretKey && 
      secretKey.trim() !== '' && 
      !secretKey.includes('tu_secret_key') && 
      !secretKey.includes('dummy')

    // 3. Si la clave real está configurada, solicitar sesión en vivo a la API de Banca.me
    if (isRealKeyConfigured) {
      try {
        const bancamePayload = {
          amount: Math.round(amount),
          externalTrxId: orderNum,
          customer: {
            name: customer.name || 'Cliente InkedSouh',
            email: customer.email || 'contacto@inkedsouh.com',
            phone: customer.phone || '+56900000000'
          },
          metadata: {
            orderNumber: orderNum,
            itemsCount: items.length,
            deliveryType: deliveryType
          }
        }

        const bancameResponse = await fetch('https://api.banca.me/partner/widget/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secretKey.trim()}`
          },
          body: JSON.stringify(bancamePayload)
        })

        if (bancameResponse.ok) {
          const bancameData = await bancameResponse.json()
          const widgetToken = bancameData.widgetToken || bancameData.token || bancameData.id

          // Actualizar token en BD
          if (widgetToken) {
            await supabase.from('orders').update({
              bancame_token: widgetToken,
              metadata: { bancame_init: bancameData }
            }).eq('order_number', orderNum).catch(() => {})
          }

          return NextResponse.json({
            success: true,
            mode: 'live',
            orderNumber: orderNum,
            widgetToken: widgetToken,
            publicKey: process.env.NEXT_PUBLIC_BANCAME_PUBLIC_KEY || null
          })
        } else {
          const errText = await bancameResponse.text()
          console.error('[Banca.me API Error]:', bancameResponse.status, errText)
          // Si la API responde con error, devolver fallback informativo
          return NextResponse.json({
            success: true,
            mode: 'sandbox_fallback',
            orderNumber: orderNum,
            widgetToken: `sim_token_${Date.now()}`,
            warning: `Banca.me API devolvió status ${bancameResponse.status}. Se activó modo de prueba.`,
            errorDetail: errText
          })
        }
      } catch (apiErr) {
        console.error('[Banca.me Fetch Error]:', apiErr)
        return NextResponse.json({
          success: true,
          mode: 'sandbox_fallback',
          orderNumber: orderNum,
          widgetToken: `sim_token_${Date.now()}`,
          warning: 'No se pudo conectar con el servidor de Banca.me. Modo prueba activo.'
        })
      }
    }

    // 4. Si aún no hay clave configurada en .env.local -> Devolver simulación limpia
    const simulatedToken = `sim_bancame_${orderNum}_${Date.now()}`
    
    // Guardar token simulado en BD
    await supabase.from('orders').update({
      bancame_token: simulatedToken,
      metadata: { mode: 'simulation' }
    }).eq('order_number', orderNum).catch(() => {})

    return NextResponse.json({
      success: true,
      mode: 'simulation',
      orderNumber: orderNum,
      widgetToken: simulatedToken,
      publicKey: process.env.NEXT_PUBLIC_BANCAME_PUBLIC_KEY || 'pk_sim_inkedsouh_test',
      message: 'Sesión iniciada en modo de pruebas / simulación. Para producción, define BANCAME_SECRET_KEY en .env.local.'
    })

  } catch (error) {
    console.error('[Banca.me Create Session Exception]:', error)
    return NextResponse.json(
      { error: 'Error interno al crear sesión de pago.', details: error.message },
      { status: 500 }
    )
  }
}
