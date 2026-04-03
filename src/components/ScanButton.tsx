'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'

export default function ScanButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const connectGmailAccess = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
  }

  const handleScan = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/scan', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        if (data?.requiresGmailReconnect) {
          alert('ต้องอนุญาตสิทธิ์ Gmail ก่อนใช้งานสแกนครับ กำลังพาไปเชื่อมต่อใหม่...')
          await connectGmailAccess()
          return
        }
        alert(data?.error ?? 'เกิดข้อผิดพลาดในการสแกน!')
        return
      }
      
      if (data.added > 0) {
        alert(`เจอแล้ว! เพิ่มไป ${data.added} รายการ`)
        router.refresh() // สั่งให้ Server Component ดึงข้อมูลใหม่มาโชว์
      } else {
        alert('ไม่พบข้อมูลการสมัครสมาชิกใหม่ในอีเมลครับ')
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการสแกน!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleScan}
      disabled={loading}
      className={`px-6 py-2 rounded-full font-semibold transition-all ${
        loading 
        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
        : 'bg-black text-white hover:bg-slate-800 active:scale-95'
      }`}
    >
      {loading ? '🔍 Scanning...' : 'Scan Gmail'}
    </button>
  )
}