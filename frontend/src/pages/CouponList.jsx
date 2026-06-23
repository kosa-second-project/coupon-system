import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserStore } from '../store/useUserStore';

/**
 * [React Page - CouponList]
 * 
 * - 사용자가 발급 가능한 모든 쿠폰의 리스트를 실시간으로 확인하고 신청할 수 있는 화면입니다.
 * - 3초 주기 폴링(Polling)을 수행하여 여러 사람이 발급 시 변경되는 잔여 수량을 실시간 갱신합니다.
 */
function CouponList() {
  const user = useUserStore((state) => state.user);
  const [coupons, setCoupons] = useState([]);
  const [loadingMap, setLoadingMap] = useState({}); 
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/coupons`);
      setCoupons(response.data);
      setFetching(false);
    } catch (error) {
      console.error('쿠폰 목록 조회 실패:', error);
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    const interval = setInterval(fetchCoupons, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleIssueCoupon = async (couponId) => {
    setLoadingMap(prev => ({ ...prev, [couponId]: true }));
    setToast(null);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/coupons/${couponId}/issue`, {
        username: user.username
      });

      setToast({ type: 'success', message: '쿠폰 발급에 성공했습니다! DB에 이력이 등록되었습니다.' });
      fetchCoupons();
    } catch (error) {
      const errorMsg = error.response?.data?.message || '쿠폰 발급에 실패했습니다.';
      setToast({ type: 'error', message: `${errorMsg}` });
    } finally {
      setLoadingMap(prev => ({ ...prev, [couponId]: false }));
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%', position: 'relative' }}>
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="badge badge-info" style={{ marginBottom: '0.8rem', padding: '0.4rem 0.9rem', gap: '0.4rem' }}>
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#38bdf8',
            animation: 'pulse 1.5s infinite'
          }}></span>
          선착순 발급 진행 중
        </span>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', margin: '0 0 0.6rem 0' }}>쿠폰 리스트</h1>
        <p className="sub-text" style={{ margin: 0 }}>실시간 선착순 쿠폰 발급에 참여해 보세요!</p>
      </div>

      {fetching ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(99, 102, 241, 0.1)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem auto'
          }}></div>
          <span>쿠폰 목록을 조회하는 중입니다...</span>
        </div>
      ) : coupons.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#475569' }}>
            <i className="bi bi-ticket-detailed"></i>
          </div>
          <p style={{ color: '#94a3b8', margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 500 }}>등록된 선착순 쿠폰이 아직 없습니다.</p>
          {user.role === 'ADMIN' && (
            <p style={{ color: '#818cf8', fontSize: '0.9rem', margin: 0 }}>
              상단 메뉴의 <strong style={{ cursor: 'pointer', textDecoration: 'underline' }}>쿠폰 관리자</strong> 탭을 통해 신규 쿠폰을 등록해 주세요!
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {coupons.map((coupon) => {
            const progress = (coupon.remainingQuantity / coupon.totalQuantity) * 100;
            const isSoldOut = coupon.remainingQuantity <= 0;
            const isButtonLoading = loadingMap[coupon.id] || false;

            return (
              <div 
                key={coupon.id} 
                className={`ticket-card ${isSoldOut ? 'sold-out' : ''}`}
                style={{
                  borderLeft: isSoldOut ? '4px solid #f43f5e' : '4px solid #6366f1',
                  opacity: isSoldOut ? 0.75 : 1
                }}
              >
                {/* Ticket Top Half */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <span className="badge badge-info" style={{ 
                      fontSize: '0.7rem', 
                      marginBottom: '0.5rem', 
                      background: 'rgba(255,255,255,0.03)', 
                      borderColor: 'rgba(255,255,255,0.06)' 
                    }}>
                      NO. {coupon.id}
                    </span>
                    <h2 style={{ 
                      fontSize: '1.35rem', 
                      fontWeight: 700, 
                      margin: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      color: isSoldOut ? '#94a3b8' : '#f8fafc' 
                    }}>
                      <i className="bi bi-gift" style={{ color: isSoldOut ? '#64748b' : '#818cf8' }}></i>
                      {coupon.name}
                    </h2>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem' }}>남은 수량</div>
                    <span style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 700, 
                      color: isSoldOut ? '#f43f5e' : '#818cf8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      <i className={isSoldOut ? "bi bi-database-exclamation" : "bi bi-database-fill-check"}></i>
                      {coupon.remainingQuantity} / {coupon.totalQuantity}
                    </span>
                  </div>
                </div>

                {/* Ticket Separator Line */}
                <div style={{
                  borderTop: '1px dashed rgba(255, 255, 255, 0.12)',
                  margin: '0.5rem -2rem 1.5rem -2rem',
                  height: '0'
                }}></div>

                {/* Ticket Bottom Half */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    <span>발급 달성률</span>
                    <span>{Math.round(100 - progress)}% 완료</span>
                  </div>

                  {/* 프로그레스 바 */}
                  <div className="progress-container" style={{ marginBottom: '1.5rem' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${progress}%`,
                        background: isSoldOut 
                          ? 'var(--error)' 
                          : 'linear-gradient(90deg, #818cf8 0%, #6366f1 100%)',
                        boxShadow: isSoldOut ? 'none' : '0 0 8px rgba(99, 102, 241, 0.4)'
                      }}
                    ></div>
                  </div>

                  {/* 발급 신청 버튼 */}
                  <button
                    onClick={() => handleIssueCoupon(coupon.id)}
                    className="glow-button"
                    disabled={isSoldOut || isButtonLoading}
                    style={{
                      background: isSoldOut 
                        ? 'rgba(30, 41, 59, 0.6)' 
                        : 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
                      border: isSoldOut ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
                    }}
                  >
                    {isButtonLoading ? (
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
                        쿠폰 발급 처리 중...
                      </>
                    ) : isSoldOut ? (
                      <>
                        <i className="bi bi-lock-fill" style={{ fontSize: '1.1rem' }}></i>
                        준비된 쿠폰이 소진되었습니다
                      </>
                    ) : (
                      <>
                        <i className="bi bi-ticket-perforated" style={{ fontSize: '1.1rem' }}></i>
                        선착순 쿠폰 발급받기
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            <i className={toast.type === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-triangle-fill'}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Local keyframe styles for animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default CouponList;
