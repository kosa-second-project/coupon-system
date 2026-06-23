import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = 'http://localhost:8080';
const COUPON_ID = 1;

export default function () {
  const username = `test_user_opti_${__VU}_${__ITER}`;
  const payload = JSON.stringify({ username: username });
  const params = { headers: { 'Content-Type': 'application/json' } };

  // 낙관적 락 API 호출 (단일 시도 방식)
  const url = `${BASE_URL}/api/coupons/${COUPON_ID}/issue/optimistic`;
  
  const response = http.post(url, payload, params);

  check(response, {
    'HTTP 응답 코드가 200 또는 400인가': (res) => res.status === 200 || res.status === 400,
    '성공적으로 발급 처리되었는가 (HTTP 200)': (res) => res.status === 200,
  });

  sleep(0.1);
}
