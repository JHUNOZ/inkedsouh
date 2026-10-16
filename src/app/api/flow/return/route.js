import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Flow.cl sends an HTTP POST request with 'token' in the form body to urlReturn
 * when the customer finishes paying on Flow's website.
 * This endpoint extracts the token and redirects (303 GET) to /checkout/flow-return?token=...
 */
export async function POST(request) {
  try {
    let token = ''
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      token = formData.get('token') || ''
    } else {
      try {
        const body = await request.json()
        token = body.token || ''
      } catch {
        const text = await request.text()
        const params = new URLSearchParams(text)
        token = params.get('token') || ''
      }
    }

    const url = new URL('/checkout/flow-return', request.url)
    if (token) {
      url.searchParams.set('token', token)
    }

    return NextResponse.redirect(url, 303)
  } catch (error) {
    console.error('[Flow Return POST Error]:', error)
    const fallbackUrl = new URL('/checkout/flow-return', request.url)
    return NextResponse.redirect(fallbackUrl, 303)
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const order = searchParams.get('order')

  const url = new URL('/checkout/flow-return', request.url)
  if (token) url.searchParams.set('token', token)
  if (order) url.searchParams.set('order', order)

  return NextResponse.redirect(url, 303)
}
