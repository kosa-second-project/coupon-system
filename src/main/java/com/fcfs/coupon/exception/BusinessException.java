package com.fcfs.coupon.exception;

import lombok.Getter;

/**
 * [비즈니스 최상위 예외 - BusinessException]
 * - 모든 사용자 정의 비즈니스 예외들의 최상위 부모 클래스입니다.
 * - RuntimeException을 상속하여 JPA 트랜잭션의 롤백(Rollback)을 보장합니다.
 */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}
