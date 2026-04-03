import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ScanButton from '@/components/ScanButton'; // สร้าง Component ปุ่มแยกเพื่อใช้ Client Logic

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // ดึงข้อมูลรายชื่อแอปที่จ่ายเงิน
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')
    .order('next_payment_date', { ascending: true });

  // คำนวณยอดรวมรายเดือน (ถ้าเป็นรายปีให้หาร 12)
  const totalMonthly = subs?.reduce((acc, sub) => {
    const monthlyPrice = sub.billing_cycle === 'monthly' ? Number(sub.price) : Number(sub.price) / 12;
    return acc + monthlyPrice;
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Welcome back, {user.email}</p>
          </div>
          <ScanButton />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-medium mb-1">Monthly Spending</h3>
            <p className="text-4xl font-black text-blue-600">฿{totalMonthly.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-medium mb-1">Active Services</h3>
            <p className="text-4xl font-black text-slate-900">{subs?.length || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Billing</th>
                <th className="px-6 py-4">Next Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subs && subs.length > 0 ? (
                subs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{sub.name}</td>
                    <td className="px-6 py-4">{Number(sub.price).toLocaleString()} {sub.currency}</td>
                    <td className="px-6 py-4 capitalize text-sm">{sub.billing_cycle}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(sub.next_payment_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    No subscriptions found. Click &quot;Scan Gmail&quot; to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}