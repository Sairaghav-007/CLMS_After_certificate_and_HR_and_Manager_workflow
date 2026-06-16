package com.example.clms.auth;

import com.example.clms.user.Role;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        Long userId,
        String fullName,
        String email,
        Role role,
        String linkedinUrl,
        String department
) {}