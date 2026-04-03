'use client'

import { createClient } from '@/utils/supabase' // ตรวจสอบ Path ให้ตรงกับที่สร้างไว้นะไอ้ชาย!

export default function LoginPage() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
      <h1 className="text-4xl font-bold mb-6">Sub-Tracker AI 🚀</h1>
      <p className="text-slate-400 mb-8 text-center max-w-md">
        หยุดจ่ายเงินฟรีให้แอปที่คุณไม่ได้ใช้! ให้ AI ช่วยสแกนและจัดการ Subscription ของคุณง่ายๆ ผ่าน Gmail
      </p>
      <button
        onClick={handleLogin}
        className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-slate-200 transition-all shadow-lg"
      >
        Login with Google
      </button>
    </div>
  )
}