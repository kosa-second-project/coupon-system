package com.fcfs.coupon.exception;

import com.fcfs.coupon.dto.common.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * [전역 예외 처리기 - GlobalExceptionHandler]
 * - @RestControllerAdvice를 적용하여 모든 컨트롤러에서 발생하는 예외를 전역적으로 가로채어 공통된 JSON 응답으로 반환합니다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * [핵심] 비즈니스 최상위 예외(BusinessException) 처리
     * - 우리가 정의한 커스텀 예외들이 터졌을 때, 사전에 정의된 ErrorCode를 사용해 일관성 있게 포맷팅합니다.
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();
        ErrorResponse response = new ErrorResponse(errorCode.getCode(), e.getMessage());
        return ResponseEntity.status(errorCode.getStatus()).body(response);
    }

    /**
     * 표준 IllegalArgumentException 처리
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException e) {
        ErrorResponse response = new ErrorResponse(ErrorCode.INVALID_INPUT_VALUE.getCode(), e.getMessage());
        return ResponseEntity.status(ErrorCode.INVALID_INPUT_VALUE.getStatus()).body(response);
    }

    /**
     * 표준 IllegalStateException 처리
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException e) {
        ErrorResponse response = new ErrorResponse(ErrorCode.INVALID_INPUT_VALUE.getCode(), e.getMessage());
        return ResponseEntity.status(ErrorCode.INVALID_INPUT_VALUE.getStatus()).body(response);
    }

    /**
     * 예상치 못한 서버 내부 오류 (Exception) 처리
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception e) {
        e.printStackTrace(); // 콘솔에 실제 시스템 에러 로깅
        ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
        ErrorResponse response = new ErrorResponse(errorCode.getCode(), errorCode.getMessage());
        return ResponseEntity.status(errorCode.getStatus()).body(response);
    }
}
