package com.fcfs.coupon.repository;

import com.fcfs.coupon.entity.CouponIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

/**
 * [Spring Boot / Spring Data JPA - CouponIssueRepository]
 * 
 * - CouponIssue 엔티티와 coupon_issues 테이블을 연결합니다.
 * - existsByUserIdAndCouponId: 특정 회원(userId)이 특정 쿠폰(couponId)을 발급받은 이력이 이미 있는지 여부를
 *   boolean(true/false) 값으로 빠르게 조회합니다. 중복 발급 방지 검증에 주로 쓰입니다.
 */
public interface CouponIssueRepository extends JpaRepository<CouponIssue, Long> {
    
    // 특정 유저에게 특정 쿠폰이 이미 발급되었는지 조회
    Optional<CouponIssue> findByUserIdAndCouponId(Long userId, Long couponId);
    
    // 특정 유저에게 특정 쿠폰이 이미 발급되었는지 여부 확인
    boolean existsByUserIdAndCouponId(Long userId, Long couponId);

    // 특정 쿠폰이 총 몇 개 발급되었는지 카운트
    long countByCouponId(Long couponId);

    // 특정 쿠폰 ID의 발급 이력을 한 번에 일괄 벌크 삭제하는 메서드 (회원 데이터는 보존)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from CouponIssue ci where ci.couponId = :couponId")
    void deleteByCouponId(@Param("couponId") Long couponId);
}

