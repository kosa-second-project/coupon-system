import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserStore } from '../store/useUserStore';

/**
 * [React Page - ConcurrencyTest]
 * 
 * - 여러 개의 API 요청을 동시에 병렬로 전송하여 선착순 쿠폰 발급 로직의 동시성을 검증하는 화면입니다.
 * - Promise.all을 활용해 순간 트래픽을 모방하고, 처리 결과를 바둑판(Grid) 상태 맵과 통계 카드로 시각화합니다.
 */
function ConcurrencyTest() {
  const user = useUserStore((state) => state.user);
  const [coupons, setCoupons] = useState([]);
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [lockType, setLockType] = useState('NONE'); // NONE, PESSIMISTIC, OPTIMISTIC
  const [requestCount, setRequestCount] = useState(100); // 동시 요청 보낼 수
  const [isRunning, setIsRunning] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [results, setResults] = useState([]); // 각 가상유저의 처리 상태 저장 ({ userId, username, status, message })
  const [summary, setSummary] = useState({ total: 0, success: 0, fail: 0, timeTaken: 0 });

  // 테스트 데이터 리셋 요청
  const handleReset = async () => {
    if (!selectedCouponId) return;
    if (!window.confirm('정말 테스트 데이터를 초기화하시겠습니까?\n(가상 유저 및 발급 내역이 DB에서 삭제되고 쿠폰 수량이 원래대로 복원됩니다.)')) return;

    setIsResetting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/coupons/${selectedCouponId}/reset`);
      alert('성공적으로 초기화되었습니다.');
      setResults([]);
      setSummary({ total: 0, success: 0, fail: 0, timeTaken: 0 });
      fetchCoupons(); // 쿠폰 정보 갱신
    } catch (error) {
      console.error('초기화 실패', error);
      alert(error.response?.data?.message || '초기화 중 오류가 발생했습니다.');
    } finally {
      setIsResetting(false);
    }
  };

  // 쿠폰 목록 불러오기
  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/coupons`);
      setCoupons(response.data);
      if (response.data.length > 0 && !selectedCouponId) {
        setSelectedCouponId(response.data[0].id);
      }
    } catch (error) {
      console.error('쿠폰 목록 로드 실패', error);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSimulate = async () => {
    if (!selectedCouponId) return;

    setIsRunning(true);
    setSummary({ total: 0, success: 0, fail: 0, timeTaken: 0 });

    // 1. 가상 유저 상태 리스트 초기화 - 이름 중복 방지를 위한 8자리 난수 추가
    const uniqueSuffix = Math.random().toString(36).substring(2, 10);
    const initialUsers = Array.from({ length: requestCount }, (_, i) => ({
      userId: i + 1,
      username: `test_user_${i + 1}_${uniqueSuffix}`,
      status: 'pending',
      message: ''
    }));
    setResults(initialUsers);

    const startTime = performance.now();

    // 2. Promise.all을 사용해 동시에 API 요청 생성 및 송신
    const requests = initialUsers.map(async (vUser, index) => {
      try {
        let url = `${import.meta.env.VITE_API_URL}/api/coupons/${selectedCouponId}/issue`;
        if (lockType === 'PESSIMISTIC') {
          url += '/pessimistic';
        } else if (lockType === 'OPTIMISTIC') {
          url += '/optimistic';
        }

        await axios.post(url, {
          username: vUser.username
        });
        
        // 성공 시 상태 업데이트
        setResults(prev => {
          const next = [...prev];
          next[index] = { ...next[index], status: 'success', message: '발급 성공' };
          return next;
        });
        return 'success';
      } catch (error) {
        const errorMsg = error.response?.data?.message || '발급 실패';
        // 실패 시 상태 업데이트
        setResults(prev => {
          const next = [...prev];
          next[index] = { ...next[index], status: 'fail', message: errorMsg };
          return next;
        });
        return 'fail';
      }
    });

    // 모든 비동기 작업이 끝날 때까지 대기
    const finalStatuses = await Promise.all(requests);
    const endTime = performance.now();

    // 3. 통계 정산
    const successCount = finalStatuses.filter(s => s === 'success').length;
    const failCount = finalStatuses.filter(s => s === 'fail').length;

    setSummary({
      total: requestCount,
      success: successCount,
      fail: failCount,
      timeTaken: Math.round(endTime - startTime)
    });
    setIsRunning(false);
    fetchCoupons(); // 쿠폰 최종 잔여량 업데이트
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-admin" style={{ marginBottom: '0.8rem', padding: '0.4rem 0.9rem', gap: '0.4rem' }}>
          <i className="bi bi-cpu-fill"></i> Concurrency Simulator
        </span>
        <h1 className="gradient-text-admin" style={{ fontSize: '2.3rem', margin: '0 0 0.5rem 0' }}>동시성 모의 테스트 대시보드</h1>
        <p className="sub-text">여러 명의 가상 사용자가 한순간에 동시에 쿠폰 발급을 요청하는 시나리오를 검증합니다.</p>
      </div>

      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        {/* 컨트롤 패널 */}
        {/* 컨트롤 패널 (2단 반응형 구조로 개편) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
          
          {/* 1단: 쿠폰 및 락 방식 선택 */}
          <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
            <div style={{ flex: 1.4, minWidth: '280px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>테스트할 쿠폰 선택</label>
              <select 
                value={selectedCouponId} 
                onChange={(e) => setSelectedCouponId(e.target.value)}
                className="custom-input"
                style={{ background: '#0f172a', color: '#fff', width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                disabled={isRunning || isResetting}
              >
                <option value="" disabled>-- 테스트할 쿠폰을 선택하세요 --</option>
                {coupons.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (남은 수량: {c.remainingQuantity} / {c.totalQuantity})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>락 방식 선택</label>
              <select 
                value={lockType} 
                onChange={(e) => setLockType(e.target.value)}
                className="custom-input"
                style={{ background: '#0f172a', color: '#fff', width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                disabled={isRunning || isResetting}
              >
                <option value="NONE">일반 (동시성 제어 없음)</option>
                <option value="PESSIMISTIC">비관적 락 (Pessimistic Lock)</option>
                <option value="OPTIMISTIC">낙관적 락 (Optimistic Lock)</option>
              </select>
            </div>
          </div>

          {/* 2단: 동시 요청 수 및 실행/리셋 버튼 */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-end', width: '100%', flexWrap: 'wrap' }}>
            <div style={{ flex: 1.2, minWidth: '240px' }}>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                동시 요청 수 ({requestCount}명)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input 
                  type="range" 
                  min="10" 
                  max="300" 
                  step="10"
                  value={requestCount}
                  onChange={(e) => setRequestCount(Number(e.target.value))}
                  disabled={isRunning}
                  style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
              <button 
                onClick={handleSimulate} 
                className="glow-button glow-button-admin"
                disabled={isRunning || isResetting || !selectedCouponId}
                style={{ flex: 1.3, padding: '0', height: '45px', fontSize: '0.9rem', borderRadius: '8px' }}
              >
                {isRunning ? '시뮬레이션 작동 중...' : '동시 요청 시작'}
              </button>

              <button 
                onClick={handleReset} 
                className="glow-button"
                disabled={isRunning || isResetting || !selectedCouponId}
                style={{ 
                  flex: 0.7, 
                  padding: '0', 
                  height: '45px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                {isResetting ? '초기화 중...' : '데이터 리셋'}
              </button>
            </div>
          </div>
        </div>

        {/* 통계 리포트 */}
        {summary.total > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1rem', 
            background: 'rgba(255,255,255,0.02)', 
            padding: '1.25rem', 
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: '2rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>총 요청 수</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>{summary.total}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>성공 유저 🟢</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{summary.success}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>실패 유저 🔴</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{summary.fail}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>소요 시간</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>{summary.timeTaken}ms</div>
            </div>
          </div>
        )}

        {/* 바둑판 시각화 그리드 */}
        {results.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#94a3b8' }}>가상 유저별 응답 실시간 모니터</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(14px, 1fr))', 
              gap: '6px',
              padding: '1.5rem',
              background: '#0a0f1d',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.03)'
            }}>
              {results.map((vUser) => {
                let color = '#334155'; // idle
                let shadow = 'none';
                let isPulse = false;

                if (vUser.status === 'pending') {
                  color = '#eab308'; // 노랑
                  isPulse = true;
                } else if (vUser.status === 'success') {
                  color = '#10b981'; // 초록
                  shadow = '0 0 8px rgba(16, 185, 129, 0.6)';
                } else if (vUser.status === 'fail') {
                  color = '#ef4444'; // 빨강
                  shadow = '0 0 8px rgba(239, 68, 68, 0.4)';
                }

                return (
                  <div 
                    key={vUser.userId}
                    title={`${vUser.username}: ${vUser.message}`}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '4px',
                      backgroundColor: color,
                      boxShadow: shadow,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: isPulse ? 'blink 1s infinite alternate' : 'none',
                      cursor: 'help'
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ConcurrencyTest;
