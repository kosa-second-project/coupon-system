package com.fcfs.coupon.controller;

import com.fcfs.coupon.dto.coupon.*;
import com.fcfs.coupon.facade.OptimisticLockCouponFacade;
import com.fcfs.coupon.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * [Spring Boot / Web (REST API) / Controller]
 * 
 * - 쿠폰 관리 및 조회, 발급 요청을 처리하는 API 컨트롤러입니다.
 * - 레이어드 아키텍처 규칙을 준수하여 데이터 노출 및 의존성 격리를 위해 Entity 대신 Response DTO를 사용해 응답합니다.
 * - 예외 처리는 GlobalExceptionHandler로 통합 분리하여 비즈니스 코드 가독성을 보장합니다.
 */
@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;
    private final OptimisticLockCouponFacade optimisticLockCouponFacade;

    /**
     * 전체 쿠폰 목록 조회
     * GET http://localhost:8080/api/coupons
     */
    @GetMapping
    public ResponseEntity<List<CouponResponse>> getAllCoupons() {
        List<CouponResponse> coupons = couponService.getAllCoupons();
        return ResponseEntity.ok(coupons);
    }

    /**
     * 특정 쿠폰 상세 조회
     * GET http://localhost:8080/api/coupons/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<CouponResponse> getCoupon(@PathVariable Long id) {
        CouponResponse coupon = couponService.getCoupon(id);
        return ResponseEntity.ok(coupon);
    }

    /**
     * [관리자 전용] 쿠폰 생성 API
     * POST http://localhost:8080/api/coupons
     */
    @PostMapping
    public ResponseEntity<CouponResponse> createCoupon(@RequestBody CreateCouponRequest request) {
        CouponResponse coupon = couponService.createCoupon(
                request.getName(),
                request.getTotalQuantity(),
                request.getAdminId()
        );
        return ResponseEntity.ok(coupon);
    }

    /**
     * 쿠폰 발급 요청 (동시성 제어 없음)
     * POST http://localhost:8080/api/coupons/{id}/issue
     */
    @PostMapping("/{id}/issue")
    public ResponseEntity<CouponIssueResponse> issueCoupon(@PathVariable Long id, @RequestBody IssueRequest request) {
        CouponIssueResponse issue = couponService.issueCoupon(request.getUsername(), id);
        return ResponseEntity.ok(issue);
    }

    /**
     * 쿠폰 발급 요청 (비관적 락 적용)
     * POST http://localhost:8080/api/coupons/{id}/issue/pessimistic
     */
    @PostMapping("/{id}/issue/pessimistic")
    public ResponseEntity<CouponIssueResponse> issueCouponWithPessimisticLock(@PathVariable Long id, @RequestBody IssueRequest request) {
        CouponIssueResponse issue = couponService.issueCouponWithPessimisticLock(request.getUsername(), id);
        return ResponseEntity.ok(issue);
    }

    /**
     * 쿠폰 발급 요청 (낙관적 락 적용)
     * POST http://localhost:8080/api/coupons/{id}/issue/optimistic
     */
    @PostMapping("/{id}/issue/optimistic")
    public ResponseEntity<CouponIssueResponse> issueCouponWithOptimisticLock(@PathVariable Long id, @RequestBody IssueRequest request) throws InterruptedException {
        CouponIssueResponse issue = optimisticLockCouponFacade.issueCoupon(request.getUsername(), id);
        return ResponseEntity.ok(issue);
    }

    /**
     * 테스트용 가상 데이터 및 쿠폰 수량 리셋 API
     * POST http://localhost:8080/api/coupons/{id}/reset
     */
    @PostMapping("/{id}/reset")
    public ResponseEntity<?> resetTestData(@PathVariable Long id) {
        couponService.resetTestData(id);
        return ResponseEntity.ok().body(java.util.Map.of("message", "테스트 데이터 초기화 완료"));
    }
}


