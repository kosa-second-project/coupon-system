package com.fcfs.coupon.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fcfs.coupon.exception.CouponSoldOutException;

/**
 * [Spring Boot / JPA / Domain Model]
 * 
 * - Coupon 엔티티는 선착순 쿠폰 정보와 총 수량, 남은 수량을 가집니다.
 * - 이 클래스는 단순한 데이터 저장소가 아니라, 자신의 상태를 직접 관리하는 비즈니스 로직(decreaseQuantity)을 포함하는 '도메인 모델' 구조입니다.
 */
@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // 쿠폰의 이름 (예: "선착순 100명 50% 할인 쿠폰")

    @Column(nullable = false)
    private int totalQuantity; // 쿠폰의 최초 전체 발행 개수

    @Column(nullable = false)
    private int remainingQuantity; // 현재 남은 쿠폰 개수 (발급 시 감소함)


    /**
     * [핵심 도메인 로직]
     * 쿠폰의 잔여 수량을 1 감소시키는 메서드입니다.
     * 엔티티 스스로 객체의 상태값을 변경하고 검증하는 책임을 가집니다.
     * (객체지향 설계에서 객체가 스스로의 데이터를 제어하도록 함)
     */
    public void decreaseQuantity() {
        if (this.remainingQuantity <= 0) {
            throw new CouponSoldOutException(); // 남은 수량이 없으면 커스텀 예외 던짐
        }
        this.remainingQuantity--;
    }
}

