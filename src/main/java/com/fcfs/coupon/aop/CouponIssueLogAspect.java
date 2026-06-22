package com.fcfs.coupon.aop;

import com.fcfs.coupon.controller.CouponController;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * [Spring Boot / AOP (Aspect Oriented Programming)]
 * 
 * - 쿠폰 발급 요청(Controller의 issue* 메서드)에 대한 공통 로깅을 처리하는 Aspect 클래스입니다.
 * - 비즈니스 코드에서 로깅을 완벽하게 분리하여 핵심 로직의 가독성과 유지보수성을 극대화합니다.
 */
@Aspect
@Component
@Slf4j
public class CouponIssueLogAspect {

    /**
     * CouponController의 issue로 시작하는 모든 메서드에 대해 동작하는 Around 어드바이스입니다.
     * 성공 시 log.info, 예외 발생 시 log.warn을 남기고 다시 예외를 호출부로 위임(throw)합니다.
     */
    @Around("execution(* com.fcfs.coupon.service.CouponService.issue*(..))")
    public Object logCouponIssue(ProceedingJoinPoint joinPoint) throws Throwable {
        // 1. 조인포인트(메서드) 매개변수 추출 (Service의 파라미터는 String username, Long couponId 순서)
        Object[] args = joinPoint.getArgs();
        String username = (String) args[0];
        Long couponId = (Long) args[1];

        // 2. 실행되는 메서드 명을 통해 락 타입 분기
        String methodName = joinPoint.getSignature().getName();
        String lockType = "락 없음";
        if (methodName.contains("Pessimistic")) {
            lockType = "비관적 락";
        } else if (methodName.contains("Optimistic")) {
            lockType = "낙관적 락";
        }

        try {
            // 3. 실제 컨트롤러/서비스 로직 수행
            Object result = joinPoint.proceed();
            
            // 성공 로깅
            log.info("[선착순 쿠폰 발급] [{}] 성공 - 사용자: {}, 쿠폰 ID: {}", lockType, username, couponId);
            return result;
        } catch (Throwable e) {
            // 실패 로깅
            log.warn("[선착순 쿠폰 발급] [{}] 실패 - 사용자: {}, 쿠폰 ID: {}, 실패 사유: {}", lockType, username, couponId, e.getMessage());
            
            // 다시 예외를 던져 기존의 ExceptionHandler나 컨트롤러 try-catch 블록이 대응하도록 합니다.
            throw e;
        }
    }
}
