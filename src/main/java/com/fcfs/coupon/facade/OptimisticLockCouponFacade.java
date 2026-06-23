package com.fcfs.coupon.facade;

import com.fcfs.coupon.dto.CouponIssueResponse;
import com.fcfs.coupon.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

/**
 * [낙관적 락 재시도 전용 파사드]
 * - 낙관적 락 충돌 시 발생하는 ObjectOptimisticLockingFailureException 예외를 처리합니다.
 * - 실패 시 짧은 대기 시간(Backoff) 후에 재시도(Retry)를 수행하여, 쿠폰이 다 발급될 때까지 보장합니다.
 */
@Component
@RequiredArgsConstructor
public class OptimisticLockCouponFacade {

    private final CouponService couponService;
    
    // 재시도 횟수 측정을 위한 정적 카운터
    public static final AtomicLong retryCount = new AtomicLong(0);

    public CouponIssueResponse issueCoupon(String username, Long couponId) throws InterruptedException {
        while (true) {
            try {
                return couponService.issueCouponWithOptimisticLock(username, couponId);
            } catch (ObjectOptimisticLockingFailureException e) {
                retryCount.incrementAndGet(); // 재시도 카운트 증가
                // 낙관적 락 버전 충돌 발생 시 50ms 대기 후 재시도
                Thread.sleep(50);
            }
        }
    }
}
