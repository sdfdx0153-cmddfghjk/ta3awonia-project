'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { loadCollection, addCollection, lsGet } from '@/lib/persist';
import { StatCard, Loading, Empty } from '@/components/ui';

const COL = 'profit_distributions';

export default function ProfitsPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const { items, source, error } = await loadCollection(api, '/api/profit-distributions', COL);
    setHistory(Array.isArray(items) ? items : []);
    setLoading(false);
    if (source === 'local' && error) setMsg(`⚠️ الخادم: ${error} — محفوظ محلياً`);
  }

  useEffect(() => { load(); }, []);

  async function calc() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return alert('⚠️ أدخل المبلغ!');
    try {
      setResult(await api.post('/api/profit-distributions/calculate', { total_profit: amt }));
    } catch (e) {
      // fallback: equal split from local members
      const members = lsGet('members').filter((m) => m.is_active !== false);
      if (!members.length) return alert(`❌ ${e.message}`);
      const totalShares = members.reduce((s, m) => s + Number(m.shares_count || m.share_amount || 1), 0) || members.length;
      const shares = members.map((m) => {
        const sh = Number(m.shares_count || m.share_amount || 1);
        const portion = (sh / totalShares) * amt;
        return { member_id: m.id, member_name: m.full_name, shares: sh, amount: portion };
      });
      setResult({ total_profit: amt, members_count: members.length, total_shares: totalShares, shares });
      setMsg(`⚠️ حساب محلي (الخادم: ${e.message})`);
    }
  }

  async function save() {
    if (!result) return;
    if (!confirm('هل تريد حفظ هذا التوزيع؟')) return;
    const body = {
      total_profit: result.total_profit,
      notes,
      shares: result.shares,
      members_count: result.members_count,
      date: new Date().toISOString().slice(0, 10),
    };
    const { item, apiError } = await addCollection(api, '/api/profit-distributions', COL, body);
    setHistory((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
    alert(apiError ? `✅ محفوظ محلياً!\n(${apiError})` : '✅ تسجّل توزيع الأرباح!');
    setResult(null);
    setAmount('');
    setNotes('');
  }

  if (loading) return <Loading />;

  return (
    <div>
      <h4 style={{ marginBottom: 18, fontWeight: 'bold' }}>💹 توزيع الأرباح</h4>

      <div className="wc">
        <div className="wc-head"><div className="wc-title">🧮 احسب التوزيع</div></div>
        <div className="row g-3 align-items-end">
          <div className="col-md-4"><div className="field"><label>المبلغ الإجمالي للتوزيع د.م *</label><input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" /></div></div>
          <div className="col-md-4"><div className="field"><label>ملاحظات</label><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أرباح الفصل الأول 2024" /></div></div>
          <div className="col-md-4" style={{ paddingBottom: 12 }}><button className="btn btn-p w-100" onClick={calc}>🧮 احسب التوزيع</button></div>
        </div>
      </div>

      {result && (
        <div className="wc">
          <div className="wc-head">
            <div className="wc-title">📊 توزيع {Number(result.total_profit).toFixed(2)} د.م على {result.members_count} أعضاء</div>
            <button className="btn btn-s" onClick={save}>💾 حفظ التوزيع</button>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4"><StatCard color="c-green" icon="coins" label="المبلغ الموزّع" value={`${Number(result.total_profit).toFixed(2)} د.م`} /></div>
            <div className="col-md-4"><StatCard color="c-blue" icon="users" label="عدد الأعضاء" value={result.members_count} /></div>
            <div className="col-md-4"><StatCard color="c-purple" icon="wallet" label="مجموع المساهمات" value={`${Number(result.total_shares).toFixed(2)} د.م`} /></div>
          </div>
          <div className="table-wrap">
            <table className="ct">
              <thead><tr><th>#</th><th>العضو</th><th>مساهمته</th><th>النسبة %</th><th>يستحق</th></tr></thead>
              <tbody>
                {result.shares.map((s, i) => (
                  <tr key={i}>
                    <td><span className="bi">{i + 1}</span></td>
                    <td><strong>{s.member_name}</strong></td>
                    <td>{s.share_amount} د.م</td>
                    <td><span className="bs">{s.share_percent}%</span></td>
                    <td><strong style={{ color: '#43e97b', fontSize: '1.08em' }}>{Number(s.profit_amount).toFixed(2)} د.م</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="wc table-wrap">
        <div className="wc-head"><div className="wc-title">📚 سجل التوزيعات السابقة</div></div>
        <table className="ct">
          <thead><tr><th>#</th><th>التاريخ</th><th>المبلغ الموزّع</th><th>عدد الأعضاء</th><th>الملاحظات</th><th>التفاصيل</th></tr></thead>
          <tbody>
            {history.length === 0 && <Empty colSpan={6} text="لا توجد توزيعات" />}
            {history.map((d) => (
              <tr key={d.id}>
                <td><span className="bi">{d.id}</span></td>
                <td>{String(d.date).slice(0, 10)}</td>
                <td><strong style={{ color: '#43e97b' }}>{Number(d.total_profit).toFixed(2)} د.م</strong></td>
                <td><span className="bs">{d.total_members} عضو</span></td>
                <td style={{ color: '#999' }}>{d.notes || '-'}</td>
                <td>
                  <button className="btn btn-p btn-sm" onClick={() => {
                    const details = d.shares.map((s) => `${s.member_name}: ${Number(s.profit_amount).toFixed(2)} د.م (${s.share_percent}%)`).join('\n');
                    alert(`📋 تفاصيل التوزيع #${d.id}\nالتاريخ: ${String(d.date).slice(0, 10)}\nالمبلغ: ${Number(d.total_profit).toFixed(2)} د.م\n\n${details}`);
                  }}>
                    📋 تفاصيل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
