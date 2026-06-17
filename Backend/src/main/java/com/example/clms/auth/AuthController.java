package com.example.clms.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.example.clms.auth.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/signup/employee")
    public AuthResponse employeeSignup(@RequestBody EmployeeSignupRequest request) {
        return authService.employeeSignup(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout/{userId}")
    public void logout(@PathVariable Long userId) {
        authService.logout(userId);
    }

    @GetMapping("/me")
    public AuthResponse getMe(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        return authService.getMeFromToken(authHeader);
    }

    public static class ProfileUpdateRequest {
        public String fullName;
        public String linkedinUrl;
    }

    @PutMapping("/profile")
    public AuthResponse updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody ProfileUpdateRequest request
    ) {
        return authService.updateProfileFromToken(authHeader, request.fullName, request.linkedinUrl);
    }

    @PostMapping("/fcm-token")
    public org.springframework.http.ResponseEntity<Void> updateFcmToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody java.util.Map<String, String> body
    ) {
        String token = body.get("fcmToken");
        System.out.println("[DEBUG] AuthController POST /fcm-token hit with token: " + token + ", authHeader: " + authHeader);
        authService.updateFcmToken(authHeader, token);
        return org.springframework.http.ResponseEntity.ok().build();
    }
}
