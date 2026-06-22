package com.fcfs.coupon.repository;

import com.fcfs.coupon.entity.Coupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

/**
 * [Spring Boot / Spring Data JPA]
 * 
 * - JpaRepository<EntityClass, PrimaryKeyType>를 상속받으면 기본적인 CRUD 메서드들이 자동으로 생성됩니다.
 *   (save(), findById(), findAll(), deleteById() 등 코드를 직접 짜지 않아도 다 쓸 수 있게 됩니다.)
 * 
 * - 쿼리 메소드(Query Methods): 규정된 명명 규칙에 맞게 인터페이스에 메서드를 선언하기만 하면,
 *   Spring Data JPA가 런타임에 알아서 SQL 쿼리를 생성하여 동작시킵니다.
 *   (여기선 findByName이 "SELECT * FROM coupons WHERE name = ?" 와 같은 SQL로 매핑됨)
 */
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    
    // 쿠폰 이름으로 쿠폰을 조회하는 메서드
    Optional<Coupon> findByName(String name);

    // 비관적 락(Pessimistic Write Lock)을 사용해 특정 쿠폰 정보를 조회하는 메서드
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Coupon c where c.id = :id")
    Optional<Coupon> findByIdWithPessimisticLock(@Param("id") Long id);

    // 쿠폰의 수량과 버전을 네이티브 쿼리로 안전하게 초기화하는 벌크 메서드
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE coupons SET remaining_quantity = total_quantity, version = 0 WHERE id = :id", nativeQuery = true)
    void resetCouponQuantity(@Param("id") Long id);
}

