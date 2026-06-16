import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [shake, setShake] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setToast({ type: 'error', message: '모든 필드를 입력해 주세요.' });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      await axios.post('http://localhost:8080/api/users/signup', {
        username: username.trim(),
        password: password.trim(),
        role: role
      });

      setToast({ type: 'success', message: '회원가입에 성공했습니다! 로그인 페이지로 이동합니다...' });
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (error) {
      const errorMsg = error.response?.data?.message || '회원가입 중 에러가 발생했습니다.';
      setToast({ type: 'error', message: `${errorMsg}` });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '420px', margin: '4rem auto', width: '100%' }}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.2) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
        }}>
          <i className="bi bi-person-plus-fill" style={{ fontSize: '1.6rem', color: '#818cf8' }}></i>
        </div>
        <h1 className="gradient-text" style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>회원가입</h1>
        <p className="sub-text" style={{ margin: 0, fontSize: '0.9rem' }}>선착순 쿠폰 시스템의 계정을 생성합니다.</p>
      </div>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
        <div className={shake && !username.trim() ? 'shake-animation' : ''}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>아이디</label>
          <div className="input-wrapper">
            <i className="bi bi-person input-icon"></i>
            <input
              type="text"
              placeholder="새로운 아이디를 입력하세요"
              className="custom-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className={shake && !password.trim() ? 'shake-animation' : ''}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>비밀번호</label>
          <div className="input-wrapper">
            <i className="bi bi-lock input-icon"></i>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              className="custom-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* 권한 등급 선택 */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>가입 권한</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.8rem',
              borderRadius: '12px',
              border: `1px solid ${role === 'USER' ? '#6366f1' : 'rgba(255, 255, 255, 0.08)'}`,
              background: role === 'USER' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(10, 15, 30, 0.6)',
              boxShadow: role === 'USER' ? '0 0 12px rgba(99, 102, 241, 0.15)' : 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: role === 'USER' ? '#fff' : '#94a3b8',
              transition: 'all 0.25s ease',
              userSelect: 'none'
            }}>
              <input
                type="radio"
                name="role"
                value="USER"
                checked={role === 'USER'}
                onChange={() => setRole('USER')}
                style={{ display: 'none' }}
              />
              <i className={`bi ${role === 'USER' ? 'bi-check-circle-fill' : 'bi-circle'}`} style={{ color: role === 'USER' ? '#818cf8' : 'inherit' }}></i>
              일반 사용자
            </label>
            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.8rem',
              borderRadius: '12px',
              border: `1px solid ${role === 'ADMIN' ? '#6366f1' : 'rgba(255, 255, 255, 0.08)'}`,
              background: role === 'ADMIN' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(10, 15, 30, 0.6)',
              boxShadow: role === 'ADMIN' ? '0 0 12px rgba(99, 102, 241, 0.15)' : 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: role === 'ADMIN' ? '#fff' : '#94a3b8',
              transition: 'all 0.25s ease',
              userSelect: 'none'
            }}>
              <input
                type="radio"
                name="role"
                value="ADMIN"
                checked={role === 'ADMIN'}
                onChange={() => setRole('ADMIN')}
                style={{ display: 'none' }}
              />
              <i className={`bi ${role === 'ADMIN' ? 'bi-check-circle-fill' : 'bi-circle'}`} style={{ color: role === 'ADMIN' ? '#818cf8' : 'inherit' }}></i>
              관리자
            </label>
          </div>
        </div>

        <button type="submit" className="glow-button" disabled={loading} style={{ marginTop: '0.75rem' }}>
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
              가입 처리 중...
            </>
          ) : (
            <>
              <i className="bi bi-person-plus" style={{ fontSize: '1.1rem' }}></i>
              회원가입
            </>
          )}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: '#64748b', position: 'relative', zIndex: 1 }}>
        이미 계정이 있으신가요?{' '}
        <span 
          onClick={() => navigate('/login')} 
          style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={(e) => e.target.style.color = '#a5b4fc'}
          onMouseLeave={(e) => e.target.style.color = '#818cf8'}
        >
          로그인하기
        </span>
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

export default Signup;
