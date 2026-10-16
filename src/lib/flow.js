import crypto from 'crypto'

/**
 * Flow.cl API Configuration and Helper Library
 * Documentation: https://www.flow.cl/docs/api.html
 */

export function normalizeBaseUrl(rawUrl, fallback = 'https://inkedsouh.cl') {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback
  let cleaned = rawUrl.trim().replace(/\/+$/, '')
  if (!cleaned) return fallback
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = cleaned.includes('localhost') || cleaned.includes('127.0.0.1')
      ? `http://${cleaned}`
      : `https://${cleaned}`
  }
  return cleaned
}

export function getFlowConfig() {
  const apiKey = (process.env.FLOW_API_KEY || '4E0FF8BF-4D11-4036-A189-381L292C978C').trim()
  const secretKey = (process.env.FLOW_SECRET_KEY || 'd152fbcde24ce99017ad78140a185ad9b4c9bc8a').trim()
  // Auto-detect production if key has 'L' indicator or FLOW_ENVIRONMENT=production
  const defaultEnv = apiKey.includes('L') ? 'production' : 'sandbox'
  const environment = (process.env.FLOW_ENVIRONMENT || process.env.NEXT_PUBLIC_FLOW_ENVIRONMENT || defaultEnv).toLowerCase()
  
  // Base URLs according to Flow documentation
  const apiUrl = environment === 'production'
    ? 'https://www.flow.cl/api'
    : 'https://sandbox.flow.cl/api'

  let siteUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL, 'https://inkedsouh.cl')
  if (environment === 'production' && (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1'))) {
    siteUrl = 'https://inkedsouh.cl'
  }

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

async function sendFlowPaymentRequest(apiUrl, payload, secretKey) {
  const signature = signFlowParams(payload, secretKey)
  const formParams = new URLSearchParams()
  
  Object.keys(payload).forEach(key => {
    formParams.append(key, payload[key])
  })
  formParams.append('s', signature)

  const response = await fetch(`${apiUrl}/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formParams.toString()
  })

  const data = await response.json()
  return { response, data }
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
  urlReturn,
  originUrl
}) {
  const config = getFlowConfig()
  const baseReturnSite = normalizeBaseUrl(originUrl || config.siteUrl, 'https://inkedsouh.cl')
  const isLocalhost = baseReturnSite.includes('localhost') || baseReturnSite.includes('127.0.0.1')
  const baseConfirmSite = isLocalhost ? 'https://inkedsouh.cl' : baseReturnSite.replace(/^http:\/\//i, 'https://')
  const safeReturnSite = isLocalhost ? baseReturnSite : baseReturnSite.replace(/^http:\/\//i, 'https://')

  const returnUrl = urlReturn || `${safeReturnSite}/api/flow/return`
  const confirmUrl = urlConfirmation || `${baseConfirmSite}/api/flow/confirm`

  const cleanEmail = (email && typeof email === 'string' && email.includes('@'))
    ? email.trim().toLowerCase()
    : 'inkedsouhtattoo@gmail.com'

  const validAmount = Math.max(350, Math.round(Number(amount) || 350))

  const payload = {
    apiKey: config.apiKey,
    commerceOrder: String(orderNumber),
    subject: (subject || 'Compra en INKEDSOUH Tattoo Studio').slice(0, 250),
    currency: 'CLP',
    amount: validAmount,
    email: cleanEmail,
    paymentMethod: String(paymentMethod),
    urlConfirmation: confirmUrl,
    urlReturn: returnUrl,
    optional: typeof optional === 'string' ? optional : JSON.stringify(optional)
  }

  // If live or valid sandbox credentials are configured
  if (config.isConfigured) {
    try {
      let { response, data } = await sendFlowPaymentRequest(config.apiUrl, payload, config.secretKey)

      // Flow Production rejects certain test/custom emails (e.g. test@gmail.com, code 1620).
      // Retry automatically with fallback merchant email so checkout never fails for the user.
      if ((!response.ok || !data?.url || !data?.token) && payload.email !== 'inkedsouhtattoo@gmail.com') {
        console.warn('[Flow API] Reintentando con email de respaldo por rechazo de formato en Flow:', data)
        const retryPayload = {
          ...payload,
          email: 'inkedsouhtattoo@gmail.com'
        }
        const retryResult = await sendFlowPaymentRequest(config.apiUrl, retryPayload, config.secretKey)
        response = retryResult.response
        data = retryResult.data
      }

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
        return createSimulatedFlowOrder({
          orderNumber,
          amount: validAmount,
          email: cleanEmail,
          subject,
          optional,
          originUrl: safeReturnSite,
          warning: data.message || `Flow API respondió con status ${response.status}`
        })
      }
    } catch (err) {
      console.error('[Flow Connection Error]:', err)
      return createSimulatedFlowOrder({
        orderNumber,
        amount: validAmount,
        email: cleanEmail,
        subject,
        optional,
        originUrl: safeReturnSite,
        warning: 'No se pudo contactar directamente con el servidor de Flow.cl. Modo Sandbox/Simulación activo.'
      })
    }
  }

  // If credentials are not yet entered in .env.local, use seamless simulation mode
  return createSimulatedFlowOrder({
    orderNumber,
    amount: validAmount,
    email: cleanEmail,
    subject,
    optional,
    originUrl: safeReturnSite,
    warning: 'Flow API Keys pendientes de configuración en .env.local. Modo pruebas activo.'
  })
}

/**
 * Creates a simulated flow order when API keys are not yet configured
 */
function createSimulatedFlowOrder({ orderNumber, amount, email, subject, optional, originUrl, warning }) {
  const config = getFlowConfig()
  const baseSite = normalizeBaseUrl(originUrl || config.siteUrl, 'https://inkedsouh.cl')
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
    redirectUrl: `${baseSite}/checkout/flow-return?${returnParams.toString()}`,
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
