import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * =========================================================================
 * [k6 부하 테스트 - 낙관적 락 (OPTIMISTIC)]
 * =========================================================================
 * - JPA의 Optimistic Lock(@Version)을 사용하여 쿠폰 수량을 차감하는 시나리오입니다.
 * 
 * - 예상되는 현상 (최초 1인만 성공 & 버전 충돌 실패):
 *   낙관적 락은 조회 시에 락을 잡지 않고, 커밋 시점에 버전 번호가 일치하는지 체크합니다.
 *   따라서 50명이 동시에 조회를 시작하면 모두 정상 조회되지만, 
 *   커밋을 시도하는 시점에 가장 먼저 커밋을 완료한 "단 1명만" 성공(HTTP 200)하고,
 *   나머지 49명은 버전 번호가 달라져 ObjectOptimisticLockingFailureException 에러가 발생해 
 *   강제로 롤백(HTTP 400 실패)됩니다.
 *   재시도 로직이 없기 때문에 성공률(HTTP 200)이 거의 1~2개 근처로 극단적으로 낮아지는 현상을 목격하게 됩니다.
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
  const username = `test_user_opti_${__VU}_${__ITER}`;
  
  // 2. 발급 API 요청에 보낼 Payload 정의
  const payload = JSON.stringify({ username: username });
  
  // 3. HTTP POST 요청에 필요한 헤더 설정 (JSON 통신)
  const params = { headers: { 'Content-Type': 'application/json' } };

  // 4. 낙관적 락 발급 API 호출 (@Version 필드 비교 및 롤백 예외처리 자동 적용)
  const url = `${BASE_URL}/api/coupons/${COUPON_ID}/issue/optimistic`;
  
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
