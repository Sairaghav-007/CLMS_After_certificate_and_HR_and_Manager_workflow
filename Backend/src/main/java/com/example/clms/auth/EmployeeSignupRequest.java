package com.example.clms.auth;

public record EmployeeSignupRequest(
        String fullName,
        String email,
        String password,
        String linkedinUrl,
        String department
) {}
