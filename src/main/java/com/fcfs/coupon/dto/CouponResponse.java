package com.fcfs.coupon.dto;

import com.fcfs.coupon.entity.Coupon;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * [DTO - CouponResponse]
 * - 쿠폰 조회 및 생성 완료 시 반환되는 API 응답용 DTO입니다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponResponse {
    private Long id;
    private String name;
    private int totalQuantity;
    private int remainingQuantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Coupon 엔티티를 받아 CouponResponse DTO로 변환하는 정적 메서드
     */
    public static CouponResponse from(Coupon coupon) {
        if (coupon == null) return null;
        return CouponResponse.builder()
                .id(coupon.getId())
                .name(coupon.getName())
                .totalQuantity(coupon.getTotalQuantity())
                .remainingQuantity(coupon.getRemainingQuantity())
                .createdAt(coupon.getCreatedAt())
                .updatedAt(coupon.getUpdatedAt())
                .build();
    }
}
