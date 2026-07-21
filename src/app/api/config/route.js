import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const settingsPath = path.join(process.cwd(), 'src', 'data', 'settings.json')

export async function GET() {
  try {
    const data = fs.readFileSync(settingsPath, 'utf8')
    return NextResponse.json(JSON.parse(data))
  } catch (err) {
    return NextResponse.json({ coursesComingSoon: true })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    // Leer actual
    let current = { coursesComingSoon: true }
    try {
      current = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    } catch (e) {}

    const updated = { ...current, ...body }
    fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2))

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar la configuración' }, { status: 500 })
  }
}
