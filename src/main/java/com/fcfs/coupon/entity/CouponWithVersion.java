package com.fcfs.coupon.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * [낙관적 락 전용 엔티티]
 * - 기존 coupons 테이블을 공유하지만, 낙관적 락을 작동시키기 위해 @Version 필드를 추가했습니다.
 */
@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponWithVersion extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private int totalQuantity;

    @Column(nullable = false)
    private int remainingQuantity;

    @Version
    private Long version; // 낙관적 락(Optimistic Lock)을 위한 버전관리 필드

    public void decreaseQuantity() {
        if (this.remainingQuantity <= 0) {
            throw new IllegalStateException("남은 쿠폰이 없습니다.");
        }
        this.remainingQuantity--;
    }
}
