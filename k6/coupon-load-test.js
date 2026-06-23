import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * =========================================================================
 * [k6 부하 테스트 옵션 설정]
 * =========================================================================
 * - vus (Virtual Users): 동시에 테스트를 진행할 가상 사용자 수
 * - duration: 테스트를 지속할 시간 (예: '10s'는 10초, '1m'은 1분)
 * 
 * - 단계별(Stages) 부하 설정도 가능합니다. (가이드 참고)
 */
export const options = {
  vus: 50,          // 동시에 50명의 가상 유저가 요청을 보냅니다.
  duration: '10s',  // 10초 동안 반복해서 요청을 보냅니다.
  
  // 성공률 임계치 설정 (선택 사항)
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95%의 요청이 1초(1000ms) 이내에 처리되어야 테스트 통과
  },
};

// 테스트할 서버 설정 (환경에 맞게 수정하여 사용하세요)
const BASE_URL = 'http://localhost:8080'; // 로컬 테스트 시
// const BASE_URL = 'http://13.125.xx.xx:8080'; // EC2 배포 서버 테스트 시 (실제 서버 IP로 수정 필요)

const COUPON_ID = 1; // 테스트할 쿠폰 ID (DB에 등록된 쿠폰 ID로 수정하세요)
const LOCK_TYPE = 'NONE'; // 테스트할 락 방식: 'NONE' (일반), 'PESSIMISTIC' (비관적), 'OPTIMISTIC' (낙관적)

/**
 * =========================================================================
 * [k6 Main 함수 (가상 유저들이 반복 수행할 비즈니스 시나리오)]
 * =========================================================================
 * - 이 default 함수는 설정한 vus(가상 유저) 수만큼 멀티스레드처럼 동작하며
 *   duration 시간 동안 계속해서 반복 호출됩니다.
 */
export default function () {
  // 1. 유저명 중복을 피하기 위해 각 스레드의 고유 번호(VU)와 반복 횟수(ITER)를 조합하여 가상 유저명을 생성합니다.
  // (Spring Boot 백엔드의 보안 규칙 상 가상 유저는 반드시 'test_user_'로 시작해야 자동 회원가입이 처리됩니다.)
  const username = `test_user_k6_${__VU}_${__ITER}`;

  // 2. 발급 API 요청에 보낼 Payload 정의
  const payload = JSON.stringify({
    username: username,
  });

  // 3. HTTP POST 요청에 필요한 헤더 설정 (JSON 통신)
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 4. 테스트할 락 방식에 따라 요청 URL 분기 처리
  let url = `${BASE_URL}/api/coupons/${COUPON_ID}/issue`;
  if (LOCK_TYPE === 'PESSIMISTIC') {
    url += '/pessimistic';
  } else if (LOCK_TYPE === 'OPTIMISTIC') {
    url += '/optimistic';
  }

  // 5. 실제 HTTP POST 요청 발송
  const response = http.post(url, payload, params);

  // 6. 결과 검증 (Response 코드가 200 성공 혹은 400 실패(예: 수량부족, 이미발급 등 비즈니스 예외)인지 확인)
  check(response, {
    'HTTP 응답 코드가 200 또는 400인가': (res) => res.status === 200 || res.status === 400,
    '성공적으로 발급 처리되었는가 (HTTP 200)': (res) => res.status === 200,
  });

  // 7. 가상 유저가 요청을 보낸 뒤 다음 요청을 보낼 때까지 약간의 휴식 시간(0.1초)을 줍니다.
  // 이 sleep이 없으면 서버에 디도스(DDoS) 공격처럼 무자비하게 트래픽이 꽂히게 됩니다.
  sleep(0.1);
}
