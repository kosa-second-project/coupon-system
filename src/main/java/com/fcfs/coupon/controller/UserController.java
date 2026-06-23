package com.fcfs.coupon.controller;

import com.fcfs.coupon.dto.user.LoginRequest;
import com.fcfs.coupon.dto.user.SignUpRequest;
import com.fcfs.coupon.dto.user.UserResponse;
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
    public ResponseEntity<UserResponse> signUp(@RequestBody SignUpRequest request) {
        UserResponse registeredUser = userService.signUp(
                request.getUsername(),
                request.getPassword(),
                request.getRole()
        );
        return ResponseEntity.ok(registeredUser);
    }

    /**
     * 로그인 API
     * POST http://localhost:8080/api/users/login
     */
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@RequestBody LoginRequest request) {
        UserResponse userResponse = userService.login(request.getUsername(), request.getPassword());
        return ResponseEntity.ok(userResponse);
    }
}
