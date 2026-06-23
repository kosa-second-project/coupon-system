package com.fcfs.coupon.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * [DTO - IssueRequest]
 * - 사용자가 쿠폰 발급을 요청할 때 전달하는 DTO입니다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IssueRequest {
    private String username;
}
