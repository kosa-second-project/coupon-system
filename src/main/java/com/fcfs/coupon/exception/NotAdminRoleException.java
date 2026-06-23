package com.fcfs.coupon.exception;

public class NotAdminRoleException extends BusinessException {
    public NotAdminRoleException() {
        super(ErrorCode.NOT_ADMIN_ROLE);
    }
}
