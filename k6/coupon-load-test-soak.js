import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * =========================================================================
 * [k6 소크 테스트 (Soak Test) 옵션]
 * =========================================================================
 * - 시스템의 메모리 누수(Memory Leak)나 커넥션 반납 누수 등을 점검하기 위해
 *   비교적 긴 시간 동안 '일정한 평상시 수준의 부하'를 쉬지 않고 지속적으로 주입합니다.
 * - 실무에서는 6~24시간씩 돌리지만, 여기선 로컬 실습용으로 2분(120초) 동안 정속 주행합니다.
 */
export const options = {
  stages: [
    { duration: '10s', target: 30 },   // 웜업: 10초 만에 가상 유저를 30명으로 올림
    { duration: '1m40s', target: 30 }, // 소크 단계: 1분 40초 동안 일정하게 30명 부하를 지속적으로 주입
    { duration: '10s', target: 0 },    // 쿨다운: 10초 만에 유저를 0으로 줄임
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'], // 장기 테스트이므로 통신 실패율이 1% 미만이어야 함
  },
};

const BASE_URL = 'http://localhost:8080';
const COUPON_ID = 1;

export default function () {
  const username = `test_user_soak_${__VU}_${__ITER}`;
  const payload = JSON.stringify({ username: username });
  const params = { headers: { 'Content-Type': 'application/json' } };

  // 비관적 락 API 호출
  const url = `${BASE_URL}/api/coupons/${COUPON_ID}/issue/pessimistic`;
  
  const response = http.post(url, payload, params);

  check(response, {
    'HTTP 응답 코드가 200 또는 400인가': (res) => res.status === 200 || res.status === 400,
    '성공적으로 발급 처리되었는가 (HTTP 200)': (res) => res.status === 200,
  });

  sleep(0.1);
}
