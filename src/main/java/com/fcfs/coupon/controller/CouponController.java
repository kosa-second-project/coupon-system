package com.fcfs.coupon.controller;

import com.fcfs.coupon.entity.Coupon;
import com.fcfs.coupon.entity.CouponIssue;
import com.fcfs.coupon.service.CouponService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * [Spring Boot / Web (REST API) / Controller]
 * 
 * - 쿠폰 관리 및 조회, 발급 요청을 처리하는 API 컨트롤러입니다.
 */
@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    /**
     * 전체 쿠폰 목록 조회
     * GET http://localhost:8080/api/coupons
     */
    @GetMapping
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponService.getAllCoupons());
    }

    /**
     * 특정 쿠폰 상세 조회
     * GET http://localhost:8080/api/coupons/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Coupon> getCoupon(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(couponService.getCoupon(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * [관리자 전용] 쿠폰 생성 API
     * POST http://localhost:8080/api/coupons
     */
    @PostMapping
    public ResponseEntity<?> createCoupon(@RequestBody CreateCouponRequest request) {
        try {
            Coupon coupon = couponService.createCoupon(
                    request.getName(),
                    request.getTotalQuantity(),
                    request.getAdminId()
            );
            return ResponseEntity.ok(coupon);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * 쿠폰 발급 요청 (동시성 제어 없음)
     * POST http://localhost:8080/api/coupons/{id}/issue
     */
    @PostMapping("/{id}/issue")
    public ResponseEntity<?> issueCoupon(@PathVariable Long id, @RequestBody IssueRequest request) {
        try {
            CouponIssue issue = couponService.issueCoupon(request.getUsername(), id);
            return ResponseEntity.ok(issue);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * 쿠폰 발급 요청 (비관적 락 적용)
     * POST http://localhost:8080/api/coupons/{id}/issue/pessimistic
     */
    @PostMapping("/{id}/issue/pessimistic")
    public ResponseEntity<?> issueCouponWithPessimisticLock(@PathVariable Long id, @RequestBody IssueRequest request) {
        try {
            CouponIssue issue = couponService.issueCouponWithPessimisticLock(request.getUsername(), id);
            return ResponseEntity.ok(issue);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * 쿠폰 발급 요청 (낙관적 락 적용)
     * POST http://localhost:8080/api/coupons/{id}/issue/optimistic
     */
    @PostMapping("/{id}/issue/optimistic")
    public ResponseEntity<?> issueCouponWithOptimisticLock(@PathVariable Long id, @RequestBody IssueRequest request) {
        try {
            CouponIssue issue = couponService.issueCouponWithOptimisticLock(request.getUsername(), id);
            return ResponseEntity.ok(issue);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * 테스트용 가상 데이터 및 쿠폰 수량 리셋 API
     * POST http://localhost:8080/api/coupons/{id}/reset
     */
    @PostMapping("/{id}/reset")
    public ResponseEntity<?> resetTestData(@PathVariable Long id) {
        try {
            couponService.resetTestData(id);
            return ResponseEntity.ok().body(java.util.Map.of("message", "테스트 데이터 초기화 완료"));
        } catch (Exception e) {
            e.printStackTrace(); // 콘솔에 상세 에러 출력
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // DTO 정의
    @Data
    public static class CreateCouponRequest {
        private String name;
        private int totalQuantity;
        private Long adminId;
    }

    @Data
    public static class IssueRequest {
        private String username;
    }

    @Data
    @RequiredArgsConstructor
    public static class ErrorResponse {
        private final String message;
    }
}


