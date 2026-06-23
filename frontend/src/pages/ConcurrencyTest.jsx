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
              ⚠️ [동시성 제어 없음] 분석 보고: 갱신 손실(Lost Update) & 환경별 차이
            </h4>
            <p style={{ margin: '0 0 0.8rem 0' }}>
              락 제어가 없기 때문에 여러 트랜잭션이 <strong>동시에 같은 수량 값을 조회한 뒤, 각자 1개씩 차감한 값으로 계속 덮어씌우는 '갱신 손실(Lost Update)'</strong>이 발생합니다. 그 결과 발급 건수는 수십 개가 쌓였는데 남은 수량은 1~2개밖에 줄어들지 않는 정합성 붕괴 상태가 됩니다.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <div>
                <strong style={{ color: '#60a5fa' }}>💻 로컬 환경 (Local):</strong> 네트워크 지연(Latency)이 거의 없고 PC 성능이 뛰어나기 때문에, DB의 암묵적인 로우 락(Row Lock) 대기 시간이 매우 짧습니다. 따라서 타임아웃 제한 시간을 넘기지 않아 <strong>실패율 0%(모두 성공)</strong>가 나오지만, 실제 데이터는 엄청난 초과 발급이 발생한 상태가 됩니다.
              </div>
              <div>
                <strong style={{ color: '#f87171' }}>☁️ 배포 환경 (AWS EC2 + RDS 프리티어):</strong> AWS 서버 간의 네트워크 레이턴시가 발생하고 RDS의 하드웨어 스펙이 낮기 때문에, 동일한 데이터를 수정하기 위한 로우 락 대기 줄이 길게 늘어집니다. 결국 대기 시간이 한계치를 초과하여 <strong>DB의 락 타임아웃(Lock wait timeout)</strong> 또는 <strong>커넥션 풀 고갈(HikariCP Connection Timeout)</strong>로 인해 <strong>실패(빨간색) 요청이 대거 발생</strong>하게 됩니다.
              </div>
            </div>
            <div style={{ padding: '0.8rem 1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
              <strong style={{ color: '#fca5a5' }}>💡 쉽게 이해하는 비유 (칠판 숫자 낙서)</strong><br />
              두 명의 학생이 칠판에 적힌 숫자 '100'을 보고 동시에 '1을 빼는 낙서'를 하러 달려갑니다. 둘 다 머릿속으로 '100 - 1 = 99'를 계산한 상태로 칠판에 적기 때문에, 두 명이 낙서를 끝냈음에도 칠판에는 '98'이 아닌 '99'가 남게 되는 현상과 같습니다. (1명의 작업이 공중으로 날아감)
            </div>
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
              🔒 [비관적 락] 분석 보고: 완벽한 정합성 보장 & 병목 분석
            </h4>
            <p style={{ margin: '0 0 0.8rem 0' }}>
              데이터를 조회할 때부터 <code>SELECT ... FOR UPDATE</code>를 실행해 물리적인 데이터 행에 잠금을 걸어버립니다. 먼저 도달한 트랜잭션이 끝나기 전까지 다른 트랜잭션들은 차례대로 대기(줄 세우기)하므로, <strong>성공한 사람 수와 감소한 수량이 단 1개의 오차도 없이 일치</strong>하게 됩니다.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <div>
                <strong style={{ color: '#60a5fa' }}>💻 로컬 환경 (Local):</strong> 순차 대기 속도가 타임아웃 기준(30~50초)을 넘지 않으므로, 남은 수량 한도까지 정상적으로 발급에 성공하고 수량이 소진된 이후의 요청은 비즈니스 예외(수량 부족)로 깔끔하게 처리됩니다.
              </div>
              <div>
                <strong style={{ color: '#f87171' }}>☁️ 배포 환경 (AWS EC2 + RDS 프리티어):</strong> 트랜잭션 시간이 길어져 대기 큐의 꼬리가 길어집니다. 이로 인해 뒤쪽에 서 있는 요청들은 대기 한계 시간을 초과하여 <strong>비즈니스 로직(수량 부족)이 실행되기도 전에 타임아웃 에러로 강제 실패</strong>하게 됩니다. 대규모 트래픽 환경에서 비관적 락을 원활하게 쓰려면 커넥션 풀 튜닝과 고성능 DB 스케일업이 수반되어야 함을 배울 수 있습니다.
              </div>
            </div>
            <div style={{ padding: '0.8rem 1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
              <strong style={{ color: '#a7f3d0' }}>💡 쉽게 이해하는 비유 (1인용 화장실)</strong><br />
              누군가 들어가서 안에서 문을 잠그고 사용하는 1인용 화장실과 같습니다. 뒤에 온 사람들은 화장실 문이 열릴 때까지 무조건 밖에서 줄을 서야 하며, 대기 줄이 너무 길어지고 대기 제한 시간이 지나면 기다리던 사람이 포기하고 그냥 돌아가게(타임아웃 실패) 됩니다.
            </div>
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
              ⚙️ [낙관적 락] 분석 보고: 최초 도전자 승리 & 버전 충돌 분석
            </h4>
            <p style={{ margin: '0 0 0.8rem 0' }}>
              DB 레벨에서 락을 걸지 않는 대신, 엔티티의 <strong>버전(@Version) 컬럼</strong>을 비교해 커밋 시점에 데이터 정합성을 검증합니다. 100명이 동시에 같은 버전을 조회하여 수량 수정을 시도하므로, <strong>가장 먼저 커밋에 성공한 1명만 성공</strong>하고 나머지 99명은 버전이 어긋나 <code>ObjectOptimisticLockingFailureException</code> 에러로 즉시 실패(롤백)하게 됩니다.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <div>
                <strong style={{ color: '#60a5fa' }}>💻 로컬 환경 (Local):</strong> DB에 물리적 잠금을 전혀 걸지 않기 때문에 대기 지연이 없으며, 매우 빠른 속도로 충돌을 판정해 대다수 요청을 신속히 실패 처리합니다.
              </div>
              <div>
                <strong style={{ color: '#f87171' }}>☁️ 배포 환경 (AWS EC2 + RDS 프리티어):</strong> 로컬과 마찬가지로 1등만 통과하고 나머지는 즉시 실패하지만, 네트워크 지연에 따라 최초 커밋 성공까지의 절대적인 시간(ms)만 다소 늘어납니다. 선착순 쿠폰처럼 고충돌 환경에서 낙관적 락을 실무적으로 사용하기 위해서는 실패한 요청들을 계속 재처리해주는 **재시도(Retry) 로직(예: Facade 구현 또는 AOP 처리)**이 필수로 구현되어야 합니다.
              </div>
            </div>
            <div style={{ padding: '0.8rem 1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}>
              <strong style={{ color: '#c7d2fe' }}>💡 쉽게 이해하는 비유 (위키백과 문서 동시 편집)</strong><br />
              100명의 사람이 동시에 위키백과의 동일한 문서를 열어서 수정하기 시작합니다. 가장 먼저 편집을 마치고 '저장' 버튼을 누른 1등만 실제 문서에 반영(버전 상승)되고, 2등부터 100등까지의 사람들은 저장 시점에 "이미 수정된 문서입니다"라며 저장을 거부당해(롤백) 작업이 취소되는 것과 같습니다.
            </div>
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
