package com.fcfs.coupon.dto.user;

import com.fcfs.coupon.entity.Role;
import com.fcfs.coupon.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * [DTO - UserResponse]
 * - 회원 정보 조회 및 가입/로그인 완료 시 반환되는 안전한 응답용 DTO입니다.
 * - 보안상 민감 정보인 비밀번호(password) 필드는 제외되었습니다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private Role role;
    private LocalDateTime createdAt;

    /**
     * User 엔티티를 받아 UserResponse DTO로 변환하는 정적 메서드
     */
    public static UserResponse from(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
