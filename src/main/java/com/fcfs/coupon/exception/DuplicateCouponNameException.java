package com.fcfs.coupon.exception;

public class DuplicateCouponNameException extends BusinessException {
    public DuplicateCouponNameException() {
        super(ErrorCode.DUPLICATE_COUPON_NAME);
    }
}
