import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * =========================================================================
 * [k6 부하 테스트 - 동시성 제어 없음 (NONE)]
 * =========================================================================
 * - 동시성 제어(락)가 아예 없을 때, 여러 가상 사용자가 한꺼번에 쿠폰 발급을 시도하는 시나리오입니다.
 * 
 * - 예상되는 현상 (갱신 손실 - Lost Update):
 *   100개 제한 수량이 있는 쿠폰에 50명이 동시에 쏘면, 로컬 PC에서는 네트워크가 빨라
 *   실패(에러) 없이 100% 성공(HTTP 200)하는 것처럼 보입니다.
 *   그러나 DB의 coupons 테이블을 열어보면 남은 수량이 50개 깎인 것이 아니라,
 *   동시에 같은 데이터를 덮어쓰느라 단 1~2개밖에 차감되지 않은 정합성 붕괴가 발생합니다.
 */
export const options = {
  vus: 50,          // 동시에 50명의 가상 유저가 접속합니다.
  duration: '10s',  // 10초 동안 반복해서 API를 호출합니다.
  thresholds: {
    // 95%의 요청이 1초(1000ms) 이내에 처리되어야 테스트 통과
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = 'http://localhost:8080';
const COUPON_ID = 1;

export default function () {
  // 1. 유저명 중복을 피하기 위해 각 스레드의 고유 번호(VU)와 반복 횟수(ITER)를 조합하여 가상 유저명을 생성합니다.
  // (Spring Boot 백엔드의 보안 규칙 상 가상 유저는 반드시 'test_user_'로 시작해야 자동 회원가입이 처리됩니다.)
  const username = `test_user_none_${__VU}_${__ITER}`;
  
  // 2. 발급 API 요청에 보낼 Payload 정의
  const payload = JSON.stringify({ username: username });
  
  // 3. HTTP POST 요청에 필요한 헤더 설정 (JSON 통신)
  const params = { headers: { 'Content-Type': 'application/json' } };

  // 4. 일반 발급 API 호출 (락 미적용)
  const url = `${BASE_URL}/api/coupons/${COUPON_ID}/issue`;
  
  // 5. 실제 HTTP POST 요청 발송
  const response = http.post(url, payload, params);

  // 6. 결과 검증 (응답 코드가 200 성공 혹은 400 실패(예: 수량부족, 이미발급 등 비즈니스 예외)인지 확인)
  check(response, {
    'HTTP 응답 코드가 200 또는 400인가': (res) => res.status === 200 || res.status === 400,
    '성공적으로 발급 처리되었는가 (HTTP 200)': (res) => res.status === 200,
  });

  // 7. 다음 요청 전송 전 0.1초의 대기 시간을 부여하여 트래픽 조절
  sleep(0.1);
}
