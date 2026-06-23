package com.fcfs.coupon.dto.coupon;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * [DTO - CreateCouponRequest]
 * - 관리자가 쿠폰을 생성할 때 사용하는 요청 DTO입니다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCouponRequest {
    private String name;
    private int totalQuantity;
    private Long adminId;
}
