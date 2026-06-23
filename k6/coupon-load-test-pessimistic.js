import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * =========================================================================
 * [k6 부하 테스트 - 비관적 락 (PESSIMISTIC)]
 * =========================================================================
 * - JPA의 Pessimistic Lock(SELECT ... FOR UPDATE)을 사용하여 쿠폰 수량을 차감하는 시나리오입니다.
 * 
 * - 예상되는 현상 (완벽한 데이터 정합성 & 대기 병목):
 *   50명의 가상 유저가 10초 동안 동시에 쏘더라도, 데이터베이스 로우에 잠금이 잡혀
 *   순차적으로 하나씩 처리되므로 쿠폰은 정확하게 남은 수량 한도(100개)만큼만 성공합니다.
 *   나머지 요청은 수량이 소진되어 400(수량부족) 에러로 안전하게 롤백 처리됩니다.
 *   단, 락 획득을 위해 트랜잭션들이 줄을 서야 하므로 일반 모드에 비해 소요 시간(http_req_duration)이 늘어납니다.
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
  const username = `test_user_pessi_${__VU}_${__ITER}`;
  
  // 2. 발급 API 요청에 보낼 Payload 정의
  const payload = JSON.stringify({ username: username });
  
  // 3. HTTP POST 요청에 필요한 헤더 설정 (JSON 통신)
  const params = { headers: { 'Content-Type': 'application/json' } };

  // 4. 비관적 락 발급 API 호출 (SELECT ... FOR UPDATE)
  const url = `${BASE_URL}/api/coupons/${COUPON_ID}/issue/pessimistic`;
  
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
