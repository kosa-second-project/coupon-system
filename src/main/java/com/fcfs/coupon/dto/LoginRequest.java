package com.fcfs.coupon.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * [DTO - LoginRequest]
 * - 회원이 로그인을 시도할 때 전달하는 DTO입니다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String username;
    private String password;
}
