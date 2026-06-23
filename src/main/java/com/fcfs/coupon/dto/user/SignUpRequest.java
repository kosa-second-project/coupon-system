package com.fcfs.coupon.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * [DTO - SignUpRequest]
 * - 신규 회원이 가입을 요청할 때 전달하는 DTO입니다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignUpRequest {
    private String username;
    private String password;
    private String role;
}
