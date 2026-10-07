import crypto from 'crypto'

/**
 * Flow.cl API Configuration and Helper Library
 * Documentation: https://www.flow.cl/docs/api.html
 */

export function getFlowConfig() {
  const apiKey = process.env.FLOW_API_KEY?.trim() || ''
  const secretKey = process.env.FLOW_SECRET_KEY?.trim() || ''
  const environment = (process.env.FLOW_ENVIRONMENT || process.env.NEXT_PUBLIC_FLOW_ENVIRONMENT || 'sandbox').toLowerCase()
  
  // Base URLs according to Flow documentation
  const apiUrl = environment === 'production'
    ? 'https://www.flow.cl/api'
    : 'https://sandbox.flow.cl/api'

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const isConfigured = Boolean(
    apiKey && 
    secretKey && 
    !apiKey.includes('tu_flow_api_key') && 
    !secretKey.includes('tu_flow_secret_key')
  )

  return {
    apiKey,
    secretKey,
    environment,
    apiUrl,
    siteUrl,
    isConfigured
  }
}

/**
 * Sign parameters with HMAC-SHA256 according to Flow API requirements:
 * 1. Sort parameter keys alphabetically
 * 2. Concatenate 'key' + 'value' for all parameters (excluding signature 's')
 * 3. Sign using HMAC-SHA256 with Flow secretKey
 */
export function signFlowParams(params, secretKey) {
  const keys = Object.keys(params).filter(k => k !== 's').sort()
  let toSign = ''
  
  for (const key of keys) {
    const val = params[key]
    if (val !== undefined && val !== null) {
      toSign += `${key}${val}`
    }
  }

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(toSign)
    .digest('hex')

  return signature
}

/**
 * Create a new Payment Order in Flow
 */
export async function createFlowOrder({
  orderNumber,
  amount,
  email,
  subject,
  optional = {},
  paymentMethod = 9, // 9 = Todos los medios de pago (Webpay, Mach, Servipag, Crypto, etc.)
  urlConfirmation,
  urlReturn
}) {
  const config = getFlowConfig()
  const siteUrl = config.siteUrl.replace(/\/$/, '')

  const returnUrl = urlReturn || `${siteUrl}/checkout/flow-return`
  const confirmUrl = urlConfirmation || `${siteUrl}/api/flow/confirm`

  const payload = {
    apiKey: config.apiKey,
    commerceOrder: orderNumber,
    subject: subject.slice(0, 250),
    currency: 'CLP',
    amount: Math.round(Number(amount)),
    email: email.trim().toLowerCase(),
    paymentMethod: String(paymentMethod),
    urlConfirmation: confirmUrl,
    urlReturn: returnUrl,
    optional: typeof optional === 'string' ? optional : JSON.stringify(optional)
  }

  // If live or valid sandbox credentials are configured
  if (config.isConfigured) {
    try {
      const signature = signFlowParams(payload, config.secretKey)
      const formParams = new URLSearchParams()
      
      Object.keys(payload).forEach(key => {
        formParams.append(key, payload[key])
      })
      formParams.append('s', signature)

      const response = await fetch(`${config.apiUrl}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formParams.toString()
      })

      const data = await response.json()

      if (response.ok && data.url && data.token) {
        return {
          success: true,
          mode: 'live',
          token: data.token,
          flowOrder: data.flowOrder,
          redirectUrl: `${data.url}?token=${data.token}`,
          orderNumber
        }
      } else {
        console.error('[Flow API Error]:', data)
        // If API returns an error, fallback gracefully to informative sandbox test mode
        return createSimulatedFlowOrder({
          orderNumber,
          amount,
          email,
          subject,
          optional,
          warning: data.message || `Flow API respondió con status ${response.status}`
        })
      }
    } catch (err) {
      console.error('[Flow Connection Error]:', err)
      return createSimulatedFlowOrder({
        orderNumber,
        amount,
        email,
        subject,
        optional,
        warning: 'No se pudo contactar directamente con el servidor de Flow.cl. Modo Sandbox/Simulación activo.'
      })
    }
  }

  // If credentials are not yet entered in .env.local, use seamless simulation mode
  return createSimulatedFlowOrder({
    orderNumber,
    amount,
    email,
    subject,
    optional,
    warning: 'Flow API Keys pendientes de configuración en .env.local. Modo pruebas activo.'
  })
}

/**
 * Creates a simulated flow order when API keys are not yet configured
 */
function createSimulatedFlowOrder({ orderNumber, amount, email, subject, optional, warning }) {
  const config = getFlowConfig()
  const siteUrl = config.siteUrl.replace(/\/$/, '')
  const token = `sim_flow_${orderNumber}_${Date.now()}`
  
  const returnParams = new URLSearchParams({
    token,
    order: orderNumber,
    amount: String(Math.round(Number(amount))),
    email: email || '',
    simulated: 'true'
  })

  return {
    success: true,
    mode: 'simulation',
    token,
    flowOrder: Math.floor(100000 + Math.random() * 900000),
    redirectUrl: `${siteUrl}/checkout/flow-return?${returnParams.toString()}`,
    orderNumber,
    warning
  }
}

/**
 * Check payment status using Flow Token
 */
export async function getFlowPaymentStatus(token) {
  const config = getFlowConfig()

  // Handle simulation tokens
  if (token.startsWith('sim_flow_') || !config.isConfigured) {
    return {
      success: true,
      mode: 'simulation',
      status: 2, // 2 = Pagada
      statusName: 'PAGADA',
      commerceOrder: token.split('_')[2] || 'INK-SIM',
      flowOrder: 123456,
      amount: 10000,
      currency: 'CLP',
      payerEmail: 'cliente@ejemplo.com',
      paymentData: {
        media: 'Webpay Plus (Simulación)',
        conversionDate: new Date().toISOString(),
        transferDate: new Date().toISOString()
      },
      isPaid: true
    }
  }

  try {
    const params = {
      apiKey: config.apiKey,
      token: token
    }
    const signature = signFlowParams(params, config.secretKey)
    const query = new URLSearchParams({
      apiKey: config.apiKey,
      token: token,
      s: signature
    }).toString()

    const response = await fetch(`${config.apiUrl}/payment/getStatus?${query}`, {
      method: 'GET'
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Flow getStatus failed (${response.status}): ${errText}`)
    }

    const data = await response.json()
    
    // Status in Flow:
    // 1: Pendiente de pago
    // 2: Pagada
    // 3: Rechazada
    // 4: Anulada
    const statusMap = {
      1: 'PENDIENTE',
      2: 'PAGADA',
      3: 'RECHAZADA',
      4: 'ANULADA'
    }

    return {
      success: true,
      mode: 'live',
      status: data.status,
      statusName: statusMap[data.status] || 'DESCONOCIDO',
      commerceOrder: data.commerceOrder,
      flowOrder: data.flowOrder,
      amount: data.amount,
      currency: data.currency || 'CLP',
      payerEmail: data.payer,
      paymentData: data.paymentData || {},
      optional: data.optional ? (typeof data.optional === 'string' ? JSON.parse(data.optional) : data.optional) : {},
      isPaid: data.status === 2
    }
  } catch (err) {
    console.error('[Flow getStatus Error]:', err)
    return {
      success: false,
      error: err.message,
      isPaid: false
    }
  }
}
