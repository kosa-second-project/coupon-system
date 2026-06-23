package com.fcfs.coupon.exception;

public class AlreadyIssuedException extends BusinessException {
    public AlreadyIssuedException() {
        super(ErrorCode.ALREADY_ISSUED_COUPON);
    }
}
