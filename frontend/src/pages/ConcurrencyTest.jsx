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
  const [selectedUser, setSelectedUser] = useState(null); // 클릭하여 선택한 가상 유저 상세 데이터

  // 테스트 데이터 리셋 요청
  const handleReset = async () => {
    if (!selectedCouponId) return;
    if (!window.confirm('정말 테스트 데이터를 초기화하시겠습니까?\n(가상 유저 및 발급 내역이 DB에서 삭제되고 쿠폰 수량이 원래대로 복원됩니다.)')) return;

    setIsResetting(true);
    setSelectedUser(null); // 선택된 가상 유저 상태 초기화
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

  // 락 종류별 동시성 발생 원리 해설 카드 렌더링 함수
  const renderExplanation = () => {
    if (summary.total === 0) return null;

    switch (lockType) {
      case 'NONE':
        return (
          <div style={{
            padding: '1.5rem',
            background: 'rgba(239, 68, 68, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: '#cbd5e1',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            marginBottom: '2rem'
          }}>
            <h4 style={{ color: '#ef4444', fontSize: '1rem', fontWeight: '700', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ [동시성 제어 없음] 분석 보고: 갱신 손실(Lost Update)
            </h4>
            <p style={{ margin: '0 0 0.6rem 0' }}>
              화면 상에서는 <strong>{summary.success}명 모두 성공</strong>으로 표시되고 실제 발급 이력 DB에도 {summary.success}건이 정상 등록되었지만, 쿠폰의 남은 수량은 예상보다 훨씬 덜 깎였습니다.
            </p>
            <p style={{ margin: '0' }}>
              이유는 락이 없기 때문에 여러 트랜잭션이 <strong>동시에 같은 수량 값을 조회한 뒤, 1개씩 차감한 값으로 계속 덮어씌웠기 때문</strong>입니다. 실제 상용 서비스에서 이대로 배포할 경우, 100개 선착순 쿠폰에 수백 명이 당첨되어 대형 초과 발급 사고가 발생하게 됩니다.
            </p>
          </div>
        );
      case 'PESSIMISTIC':
        return (
          <div style={{
            padding: '1.5rem',
            background: 'rgba(16, 185, 129, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            color: '#cbd5e1',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            marginBottom: '2rem'
          }}>
            <h4 style={{ color: '#10b981', fontSize: '1rem', fontWeight: '700', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔒 [비관적 락] 분석 보고: 완벽한 데이터 정합성 (줄 세우기)
            </h4>
            <p style={{ margin: '0 0 0.6rem 0' }}>
              비관적 락은 DB 레코드를 조회할 때부터 <code>SELECT ... FOR UPDATE</code>를 통해 해당 행을 완전히 잠가버립니다.
            </p>
            <p style={{ margin: '0' }}>
              먼저 도달한 트랜잭션이 수량을 깎고 끝낼 때까지 다른 모든 트랜잭션들을 <strong>대기 상태로 줄을 세워 순차적으로 실행</strong>하기 때문에, 성공한 사람 수와 실제 감소한 수량이 <strong>단 1개의 오차도 없이 완벽하게 일치</strong>합니다. 다만, 대기 시간 때문에 소요 시간이 늘어날 수 있습니다.
            </p>
          </div>
        );
      case 'OPTIMISTIC':
        return (
          <div style={{
            padding: '1.5rem',
            background: 'rgba(99, 102, 241, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            color: '#cbd5e1',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            marginBottom: '2rem'
          }}>
            <h4 style={{ color: '#6366f1', fontSize: '1rem', fontWeight: '700', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚙️ [낙관적 락] 분석 보고: 최초 도전자 승리 및 버전 충돌
            </h4>
            <p style={{ margin: '0 0 0.6rem 0' }}>
              조회 시에는 락을 걸지 않고 자유롭게 공유하되, DB에 쓸 때 <strong>버전(@Version) 컬럼</strong>이 일치하는지 비교해 데이터 무결성을 검증합니다.
            </p>
            <p style={{ margin: '0' }}>
              100명이 동시에 같은 버전을 읽어와 수량 차감을 시도하므로, <strong>가장 먼저 트랜잭션을 끝내고 커밋한 최초 1명만 통과</strong>되고 나머지 99명은 버전이 어긋나 에러(롤백)가 납니다. 선착순 쿠폰에 사용하려면 실패한 요청에 대한 <strong>재시도(Retry) 알고리즘</strong>을 서비스에 보완하여 탑재해야 유의미하게 쓸 수 있습니다.
            </p>
          </div>
        );
      default:
        return null;
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
    setSelectedUser(null); // 새로운 시뮬레이션 시작 시 이전 선택 유저 상세 초기화
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
            marginBottom: '1.5rem'
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

        {/* 락 유형별 해설 카드 (동적 해설 출력) */}
        {renderExplanation()}

        {/* 바둑판 시각화 그리드 */}
        {results.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="bi bi-grid-3x3-gap-fill"></i> 가상 유저별 응답 실시간 모니터
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>(각 칸을 클릭하면 상세한 응답 사유를 볼 수 있습니다.)</span>
            </h3>
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
                const isSelected = selectedUser?.userId === vUser.userId;

                if (vUser.status === 'pending') {
                  color = '#eab308'; // 노랑
                  isPulse = true;
                } else if (vUser.status === 'success') {
                  color = '#10b981'; // 초록
                  shadow = isSelected ? '0 0 14px #fff' : '0 0 8px rgba(16, 185, 129, 0.6)';
                } else if (vUser.status === 'fail') {
                  color = '#ef4444'; // 빨강
                  shadow = isSelected ? '0 0 14px #fff' : '0 0 8px rgba(239, 68, 68, 0.4)';
                }

                return (
                  <div 
                    key={vUser.userId}
                    title={`${vUser.username}: ${vUser.message} (클릭하여 고정)`}
                    onClick={() => setSelectedUser(vUser)}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '4px',
                      backgroundColor: color,
                      boxShadow: shadow,
                      border: isSelected ? '2px solid #ffffff' : '1px solid transparent',
                      transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: isPulse ? 'blink 1s infinite alternate' : 'none',
                      cursor: 'pointer'
                    }}
                  />
                );
              })}
            </div>
            
            {/* 가상 유저 개별 응답 상세 카드 (클릭 시 노출) */}
            {selectedUser && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: '#090d16',
                borderRadius: '12px',
                border: `1.5px solid ${selectedUser.status === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                color: '#f8fafc',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>🔍 개별 사용자 응답 분석 (디버그 로그)</span>
                  <button 
                    onClick={() => setSelectedUser(null)} 
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}
                    title="닫기"
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '1rem', color: '#e2e8f0' }}>{selectedUser.username}</strong>
                  <span style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    backgroundColor: selectedUser.status === 'success' ? '#10b981' : '#ef4444',
                    boxShadow: selectedUser.status === 'success' ? '0 0 10px rgba(16, 185, 129, 0.4)' : '0 0 10px rgba(239, 68, 68, 0.4)'
                  }}>
                    {selectedUser.status === 'success' ? '성공 🟢' : '실패 🔴'}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#e2e8f0', 
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px', 
                  border: '1px solid rgba(255,255,255,0.02)',
                  fontFamily: 'monospace'
                }}>
                  <strong style={{ color: '#94a3b8' }}>결과 메시지:</strong> {selectedUser.message}
                </div>
              </div>
            )}
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
