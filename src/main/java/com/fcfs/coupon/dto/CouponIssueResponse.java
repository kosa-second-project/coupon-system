package com.fcfs.coupon.dto;

import com.fcfs.coupon.entity.CouponIssue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * [DTO - CouponIssueResponse]
 * - 쿠폰 발급 성공 시 반환되는 API 응답용 DTO입니다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponIssueResponse {
    private Long id;
    private Long userId;
    private Long couponId;
    private LocalDateTime createdAt;

    /**
     * CouponIssue 엔티티를 받아 CouponIssueResponse DTO로 변환하는 정적 메서드
     */
    public static CouponIssueResponse from(CouponIssue couponIssue) {
        if (couponIssue == null) return null;
        return CouponIssueResponse.builder()
                .id(couponIssue.getId())
                .userId(couponIssue.getUserId())
                .couponId(couponIssue.getCouponId())
                .createdAt(couponIssue.getCreatedAt())
                .build();
    }
}
