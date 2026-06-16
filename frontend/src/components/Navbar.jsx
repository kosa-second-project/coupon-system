import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * [React Component - Navbar]
 * 
 * - 화면 상단에 고정되어 있는 네비게이션 헤더입니다.
 * - 로그인 정보(사용자 이름, 권한)를 보여주고 로그아웃 기능을 제공합니다.
 * - 로그인한 사용자의 권한(ADMIN / USER)에 따라 관리자 페이지 또는 쿠폰 목록 페이지로 이동할 수 있는 탭을 노출합니다.
 */
function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.75rem',
      background: 'rgba(13, 20, 38, 0.5)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '20px',
      marginBottom: '2.5rem',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
    }}>
      {/* 로고 / 타이틀 영역 */}
      <div 
        onClick={() => navigate(user ? '/coupons' : '/login')} 
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.6rem',
          userSelect: 'none'
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
        }}>
          <i className="bi bi-ticket-perforated-fill" style={{ fontSize: '1.2rem', color: '#fff' }}></i>
        </div>
        <span className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          FCFS Coupon
        </span>
      </div>

      {/* 메뉴 및 로그인 상태 정보 영역 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {user ? (
          <>
            {/* 쿠폰 발급 탭 */}
            <span 
              onClick={() => navigate('/coupons')} 
              className={`nav-link ${location.pathname === '/coupons' ? 'active' : ''}`}
            >
              <i className="bi bi-ticket-detailed" style={{ fontSize: '1.05rem' }}></i>
              쿠폰 발급
            </span>

            {/* 관리자(ADMIN) 권한 소유 유저에게만 '쿠폰 관리자' 메뉴 노출 */}
            {user.role === 'ADMIN' && (
              <span 
                onClick={() => navigate('/admin')} 
                className={`nav-link ${location.pathname === '/admin' ? 'active-admin' : ''}`}
              >
                <i className="bi bi-sliders" style={{ fontSize: '1.05rem' }}></i>
                쿠폰 관리자
              </span>
            )}

            {/* 로그인된 사용자 정보 표시 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              background: 'rgba(10, 15, 30, 0.7)', 
              padding: '0.45rem 1rem', 
              borderRadius: '9999px', 
              border: '1px solid rgba(255, 255, 255, 0.05)' 
            }}>
              <i className="bi bi-person-circle" style={{ color: '#818cf8', fontSize: '1rem' }}></i>
              <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{user.username}</span>
              <span 
                className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-info'}`} 
                style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}
              >
                {user.role}
              </span>
            </div>

            {/* 로그아웃 버튼 */}
            <button 
              onClick={handleLogoutClick} 
              style={{
                background: 'rgba(244, 63, 94, 0.06)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                color: '#fb7185',
                padding: '0.45rem 1rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.2)';
              }}
            >
              <i className="bi bi-box-arrow-right"></i>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <span 
              onClick={() => navigate('/login')} 
              className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
            >
              로그인
            </span>
            <span 
              onClick={() => navigate('/signup')} 
              className={`nav-link ${location.pathname === '/signup' ? 'active' : ''}`}
            >
              회원가입
            </span>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
