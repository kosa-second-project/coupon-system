package com.fcfs.coupon.exception;

public class CouponSoldOutException extends BusinessException {
    public CouponSoldOutException() {
        super(ErrorCode.COUPON_SOLD_OUT);
    }
}
