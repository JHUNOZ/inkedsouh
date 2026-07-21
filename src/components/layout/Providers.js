'use client'

import { ConfigProvider } from '@/context/ConfigContext'

export default function Providers({ children }) {
  return (
    <ConfigProvider>
      {children}
    </ConfigProvider>
  )
}
