package com.fcfs.coupon.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * [공통 에러 코드 - ErrorCode]
 * - 비즈니스 예외들의 종류를 명확히 구분하고, HTTP 상태 코드와 전용 응답 코드 및 메시지를 일관되게 관리합니다.
 */
@Getter
public enum ErrorCode {

    // Common (C)
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", "올바르지 않은 입력값입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C002", "서버 내부 오류가 발생했습니다. 관리자에게 문의하세요."),

    // User (U)
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "존재하지 않는 사용자입니다."),
    DUPLICATE_USERNAME(HttpStatus.BAD_REQUEST, "U002", "이미 존재하는 사용자 이름입니다."),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "U003", "비밀번호가 일치하지 않습니다."),

    // Coupon (CP)
    COUPON_NOT_FOUND(HttpStatus.NOT_FOUND, "CP001", "존재하지 않는 쿠폰입니다."),
    DUPLICATE_COUPON_NAME(HttpStatus.BAD_REQUEST, "CP002", "이미 존재하는 쿠폰 이름입니다."),
    COUPON_SOLD_OUT(HttpStatus.BAD_REQUEST, "CP003", "쿠폰 수량이 모두 소진되었습니다."),
    ALREADY_ISSUED_COUPON(HttpStatus.BAD_REQUEST, "CP004", "이미 쿠폰을 발급받았습니다."),
    NOT_ADMIN_ROLE(HttpStatus.FORBIDDEN, "CP005", "관리자 권한을 가진 사용자만 쿠폰을 생성할 수 있습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
