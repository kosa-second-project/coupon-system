import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * =========================================================================
 * [k6 스트레스 테스트 (Stress Test) 옵션]
 * =========================================================================
 * - stages를 사용하여 가상 유저(VUs) 수를 서서히 올려 시스템이 무너지는 한계점을 찾습니다.
 */
export const options = {
  stages: [
    { duration: '10s', target: 50 },  // 1단계: 10초 동안 가상 유저를 0명에서 50명까지 서서히 올림 (웜업)
    { duration: '20s', target: 50 },  // 2단계: 50명 유저로 20초간 정상 상태 유지하며 버티는지 관찰
    { duration: '15s', target: 200 }, // 3단계: 15초 동안 가상 유저를 50명에서 200명까지 대폭 늘림 (한계 테스트)
    { duration: '20s', target: 200 }, // 4단계: 200명 상태로 20초간 극한 상태 유지
    { duration: '10s', target: 0 },   // 5단계: 10초 동안 유저를 0명으로 줄이며 안정화 (쿨다운)
  ],
  thresholds: {
    // 95%의 요청이 1.5초(1500ms) 이내에 처리되어야 하고, 에러율은 5% 미만이어야 테스트 통과
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:8080';
const COUPON_ID = 1;

export default function () {
  // 고유한 유저명을 위해 VU 번호와 루프 반복 횟수(ITER)를 조합합니다.
  const username = `test_user_stress_${__VU}_${__ITER}`;
  const payload = JSON.stringify({ username: username });
  const params = { headers: { 'Content-Type': 'application/json' } };

  // 정합성 보장을 위해 기본적으로 '비관적 락' API를 호출하여 스트레스를 줍니다.
  const url = `${BASE_URL}/api/coupons/${COUPON_ID}/issue/pessimistic`;
  
  const response = http.post(url, payload, params);

  check(response, {
    'HTTP 응답 코드가 200 또는 400인가': (res) => res.status === 200 || res.status === 400,
    '성공적으로 발급 처리되었는가 (HTTP 200)': (res) => res.status === 200,
  });

  sleep(0.1); // 가상 유저가 0.1초 쉬었다가 다시 요청을 보냅니다.
}
