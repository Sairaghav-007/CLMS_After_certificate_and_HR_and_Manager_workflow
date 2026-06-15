package com.example.clms.auth;

import com.example.clms.user.Role;

public record LoginRequest(
        String email,
        String password,
        Role role
) {}