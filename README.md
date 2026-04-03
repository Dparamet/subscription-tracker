# Sub-Tracker AI
https://subscription-tracker-three-omega.vercel.app/
เว็บแอปสำหรับช่วยตรวจหา Subscription จาก Gmail และสรุปข้อมูลเพื่อบันทึกลง Supabase

> โครงการนี้ใช้ Next.js (App Router) + Supabase Auth + Gmail API + AI extraction

---

## Features

- Login ด้วย Google ผ่าน Supabase
- Dashboard แสดงบริการที่สมัคร, ยอดรายเดือน, และวันจ่ายรอบถัดไป
- ปุ่ม Scan Gmail เพื่อดึงอีเมลใบเสร็จ/สมัครบริการ
- ใช้ AI ช่วยแปลงข้อมูลอีเมลเป็นข้อมูลโครงสร้างก่อนบันทึกฐานข้อมูล
- รองรับ flow ขอสิทธิ์ Gmail แยกจาก login (ลดโอกาสโดน Google บล็อก)

---

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Vercel AI SDK (`ai`, `@ai-sdk/google`)

---

## Project Structure (สำคัญ)

- หน้าแรก route `/` อยู่ที่ `src/app/page.tsx`
- โค้ด login UI อยู่ที่ `src/page.tsx` และถูก import มาใช้ใน `src/app/page.tsx`
- API scan อยู่ที่ `src/app/api/scan/route.ts`

---

## Prerequisites

- Node.js 20+ (แนะนำ LTS)
- บัญชี Supabase
- Google Cloud project (สำหรับ OAuth + Gmail API)
- Gemini API key (Google AI Studio)

---

## Environment Variables

สร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์ แล้วใส่ค่าตามนี้:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
GOOGLE_GENERATIVE_AI_API_KEY=YOUR_GEMINI_API_KEY
```

> ห้ามใส่ค่าจริงลง README หรือ commit ไฟล์ `.env*` ขึ้น GitHub

---

## Local Setup

1. ติดตั้ง dependencies
	 - `npm install`

2. รันโหมดพัฒนา
	 - `npm run dev`

3. เปิดเบราว์เซอร์ที่
	 - `http://localhost:3000`

---

## Supabase Setup

### 1) เปิด Google Provider

ใน Supabase Dashboard:

- `Authentication` → `Providers` → `Google`
- ใส่ Google OAuth `Client ID` / `Client Secret`
- ตั้ง Redirect URL ให้มี:
	- `http://localhost:3000/auth/callback`

### 2) สร้างตาราง `subscriptions`

ตัวอย่าง SQL ขั้นต่ำ:

```sql
create table if not exists public.subscriptions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null,
	name text not null,
	price numeric not null,
	currency text not null,
	billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
	next_payment_date date,
	status text default 'active',
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

create unique index if not exists subscriptions_name_user_unique
	on public.subscriptions (name, user_id);
```

> ปรับ RLS policy ให้ผู้ใช้เห็นเฉพาะข้อมูลของตัวเองตามการใช้งานจริง

---

## Google OAuth + Gmail API Setup

### 1) OAuth Consent Screen

- ถ้ายังพัฒนาอยู่ ใช้ `Testing` mode
- เพิ่มอีเมลที่ต้องการใช้งานใน `Test users`

### 2) เปิด API ที่จำเป็น

- Gmail API

### 3) หากเจอ "app blocked" หรือ "unverified"

- ตรวจว่าอีเมลนั้นถูกเพิ่มใน `Test users` แล้ว
- หากต้องเปิดให้คนทั่วไปใช้ ต้องทำ `Publish app` + ส่ง verification ตามข้อกำหนด Google

---

## Usage Flow

1. เข้าหน้าเว็บและ Login ด้วย Google
2. เข้า Dashboard
3. กด `Scan Gmail`
4. ถ้ายังไม่เคยให้สิทธิ์ Gmail ระบบจะพาไปขอ consent เพิ่ม
5. ระบบสแกนอีเมลและบันทึกข้อมูลลง `subscriptions`

---

## Scripts

- `npm run dev` — รัน dev server (ตั้งค่าให้ใช้ webpack เพื่อลดการใช้ RAM)
- `npm run dev:turbo` — รัน dev ด้วย Turbopack
- `npm run build` — build production
- `npm run start` — run production build
- `npm run lint` — ตรวจ lint

---

## Troubleshooting

### `Unsupported provider: provider is not enabled`

Google provider ยังไม่เปิดใน Supabase หรือยังไม่ได้ใส่ Client ID/Secret

### `Module not found: Can't resolve '@ai-sdk/google'`

ติดตั้ง dependencies ในโฟลเดอร์โปรเจกต์นี้โดยตรง:

- `npm install`

### `Failed to scan Gmail`

- ตรวจว่าได้ consent สิทธิ์ Gmail แล้ว
- ตรวจ `GOOGLE_GENERATIVE_AI_API_KEY`
- ดูข้อความ error ล่าสุดจาก API response

---

## Security Checklist (ก่อนขึ้น GitHub)

- [ ] ไม่มี API key / token / secret ในไฟล์โค้ด
- [ ] ไฟล์ `.env*` ไม่ถูก commit
- [ ] หากเคยเผลอเผยแพร่ key ให้ rotate key ใหม่ทันที
- [ ] ไม่ commit log ที่มีข้อมูล credential

---

## License

MIT (หรือแก้ตามที่ต้องการ)
