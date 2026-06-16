import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * [React Page - AdminCoupon]
 * 
 * - 관리자(ADMIN)만 접근하여 신규 쿠폰을 등록하는 화면입니다.
 * - 신규 쿠폰 생성 양식 및 현재 DB에 등록되어 있는 쿠폰들의 전체 목록을 테이블 형태로 시각화합니다.
 */
function AdminCoupon({ user }) {
  const [name, setName] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [coupons, setCoupons] = useState([]);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/coupons');
      setCoupons(response.data);
    } catch (error) {
      console.error('쿠폰 목록 로드 실패:', error);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();

    if (!name.trim() || !totalQuantity) {
      setToast({ type: 'error', message: '쿠폰 이름과 발급 수량을 모두 입력해 주세요.' });
      return;
    }

    const qty = parseInt(totalQuantity);
    if (isNaN(qty) || qty <= 0) {
      setToast({ type: 'error', message: '발급 수량은 1장 이상이어야 합니다.' });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      await axios.post('http://localhost:8080/api/coupons', {
        name: name.trim(),
        totalQuantity: qty,
        adminId: user.id
      });

      setToast({ type: 'success', message: '새 선착순 쿠폰이 정상적으로 등록되었습니다!' });
      
      setName('');
      setTotalQuantity('');
      fetchCoupons();
    } catch (error) {
      const errorMsg = error.response?.data?.message || '쿠폰 등록 도중 오류가 발생했습니다.';
      setToast({ type: 'error', message: `${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <span className="badge badge-admin" style={{ marginBottom: '0.8rem', padding: '0.4rem 0.9rem', gap: '0.4rem' }}>
          <i className="bi bi-shield-fill-check"></i>
          ADMIN PANEL
        </span>
        <h1 className="gradient-text-admin" style={{ fontSize: '2.5rem', margin: '0 0 0.6rem 0' }}>쿠폰 관리자 모드</h1>
        <p className="sub-text" style={{ margin: 0 }}>관리자 권한으로 선착순 쿠폰을 새로 생성하고 모니터링합니다.</p>
      </div>

      {/* Main Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* 쿠폰 생성 Form 카드 */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="bi bi-plus-lg" style={{ color: 'var(--admin)' }}></i>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: '#fff' }}>새 쿠폰 등록</h2>
          </div>

          <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>쿠폰 이름</label>
              <div className="input-wrapper">
                <i className="bi bi-ticket-detailed input-icon"></i>
                <input
                  type="text"
                  placeholder="예: 선착순 100명 1만원 할인 쿠폰"
                  className="custom-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>전체 발급 수량 (장)</label>
              <div className="input-wrapper">
                <i className="bi bi-hash input-icon"></i>
                <input
                  type="number"
                  placeholder="예: 100"
                  className="custom-input"
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="glow-button glow-button-admin" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{
                    display: 'inline-block',
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid currentColor',
                    borderRightColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.75s linear infinite',
                    marginRight: '0.5rem'
                  }}></span>
                  등록 진행 중...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle" style={{ fontSize: '1.1rem' }}></i>
                  쿠폰 등록 완료
                </>
              )}
            </button>
          </form>
        </div>

        {/* 현재 쿠폰 현황 테이블 카드 */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="bi bi-table" style={{ color: 'var(--primary)' }}></i>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: '#fff' }}>등록된 쿠폰 현황</h2>
          </div>
          
          {coupons.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem 1rem' }}>
              <i className="bi bi-database-exclamation" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', color: '#475569' }}></i>
              등록된 쿠폰이 없습니다.
            </div>
          ) : (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>ID</th>
                    <th>쿠폰명</th>
                    <th style={{ width: '150px' }}>남은수량 / 총수량</th>
                    <th style={{ width: '100px' }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{coupon.id}</td>
                      <td style={{ fontWeight: 600 }}>{coupon.name}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontWeight: 600 }}>{coupon.remainingQuantity} / {coupon.totalQuantity}</span>
                          <div className="progress-container" style={{ height: '4px', width: '80%' }}>
                            <div className="progress-bar" style={{
                              width: `${(coupon.remainingQuantity / coupon.totalQuantity) * 100}%`,
                              background: coupon.remainingQuantity <= 0 ? 'var(--error)' : 'var(--primary)',
                              boxShadow: 'none'
                            }}></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {coupon.remainingQuantity <= 0 ? (
                          <span className="badge badge-danger">
                            <i className="bi bi-x-circle-fill"></i>
                            소진완료
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            <i className="bi bi-check-circle-fill"></i>
                            발급가능
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            <i className={toast.type === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-triangle-fill'}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Embedded Spinner Keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AdminCoupon;
