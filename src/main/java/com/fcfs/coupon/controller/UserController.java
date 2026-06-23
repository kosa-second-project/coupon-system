package com.fcfs.coupon.controller;

import com.fcfs.coupon.dto.ErrorResponse;
import com.fcfs.coupon.dto.LoginRequest;
import com.fcfs.coupon.dto.SignUpRequest;
import com.fcfs.coupon.dto.UserResponse;
import com.fcfs.coupon.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * [Spring Boot / RestController - UserController]
 * 
 * - 회원가입 및 로그인을 처리하는 REST API 컨트롤러입니다.
 * - API 응답 데이터 노출 및 보안을 위해 직접 엔티티를 노출하지 않고 UserResponse DTO를 사용합니다.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 회원 가입 API
     * POST http://localhost:8080/api/users/signup
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody SignUpRequest request) {
        try {
            UserResponse registeredUser = userService.signUp(
                    request.getUsername(),
                    request.getPassword(),
                    request.getRole()
            );
            // DTO 형태로 직접 반환하여 도메인 객체 노출 방지
            return ResponseEntity.ok(registeredUser);
        } catch (IllegalStateException e) {
            // 중복 사용자 존재 시 400 Bad Request
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * 로그인 API
     * POST http://localhost:8080/api/users/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            UserResponse userResponse = userService.login(request.getUsername(), request.getPassword());
            // DTO 형태로 직접 반환
            return ResponseEntity.ok(userResponse);
        } catch (IllegalArgumentException e) {
            // 유저가 없거나 비밀번호가 다를 시 400 Bad Request
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
