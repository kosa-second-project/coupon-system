package com.fcfs.coupon.dto.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * [DTO - ErrorResponse]
 * - API 호출 실패 시 에러 메시지와 고유 코드를 공통 포맷으로 반환하기 위한 DTO입니다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private String code;
    private String message;
}
