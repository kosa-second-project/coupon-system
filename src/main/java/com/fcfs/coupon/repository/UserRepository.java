package com.fcfs.coupon.repository;

import com.fcfs.coupon.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

/**
 * [Spring Boot / Spring Data JPA - UserRepository]
 * 
 * - User 엔티티와users 테이블을 연결하여 데이터 읽기/쓰기를 해줍니다.
 * - findByUsername: 사용자 이름(username)으로 데이터베이스에 존재하는 User가 있는지 조회합니다.
 */
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 사용자 이름으로 회원을 찾아내는 쿼리 메서드
    Optional<User> findByUsername(String username);

    // test_user_로 시작하는 가상 사용자를 조회하는 메서드
    List<User> findByUsernameStartingWith(String prefix);

    // 가상 사용자 목록을 한 번에 벌크 삭제하는 메서드
    @Modifying
    @Query("delete from User u where u.username in :usernames")
    void deleteByUsernameIn(@Param("usernames") List<String> usernames);
}

