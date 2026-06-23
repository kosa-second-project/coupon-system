package com.fcfs.coupon.exception;

import com.fcfs.coupon.dto.common.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * [전역 예외 처리기 - GlobalExceptionHandler]
 * - @RestControllerAdvice를 적용하여 모든 컨트롤러에서 발생하는 예외를 전역적으로 가로채어 공통된 JSON 응답으로 반환합니다.
 * - 이로써 컨트롤러 내부의 복잡하고 반복적인 try-catch 예외 처리 코드가 모두 제거됩니다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 비즈니스 로직 오류 (IllegalArgumentException) 처리
     * 예: 존재하지 않는 사용자, 일치하지 않는 비밀번호 조회 등
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
    }

    /**
     * 비즈니스 상태 오류 (IllegalStateException) 처리
     * 예: 이미 발급받은 쿠폰, 관리자 권한 부족, 중복 가입 등
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException e) {
        return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
    }

    /**
     * 예상치 못한 서버 내부 오류 (Exception) 처리
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception e) {
        e.printStackTrace(); // 로깅을 대신해 콘솔에 출력
        return ResponseEntity.internalServerError()
                .body(new ErrorResponse("서버 내부 오류가 발생했습니다. 관리자에게 문의하세요."));
    }
}
