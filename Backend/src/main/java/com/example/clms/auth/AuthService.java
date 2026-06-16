package com.example.clms.auth;

import com.example.clms.user.User;
import com.example.clms.user.Role;
import com.example.clms.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (user.getRole() != request.role()) {
            throw new RuntimeException("Selected login type does not match this account");
        }

        refreshTokenRepository.deleteByUserId(user.getId());

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = UUID.randomUUID().toString();

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .token(refreshToken)
                        .user(user)
                        .expiresAt(Instant.now().plusMillis(refreshTokenExpirationMs))
                        .build()
        );

        return new AuthResponse(
                accessToken,
                refreshToken,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getLinkedinUrl(),
                user.getDepartment()
        );
    }

    @Transactional
    public AuthResponse employeeSignup(EmployeeSignupRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .fullName(request.fullName())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.EMPLOYEE)
                .active(true)
                .linkedinUrl(request.linkedinUrl())
                .department(request.department())
                .build();

        User savedUser = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(savedUser);
        String refreshToken = UUID.randomUUID().toString();

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .token(refreshToken)
                        .user(savedUser)
                        .expiresAt(Instant.now().plusMillis(refreshTokenExpirationMs))
                        .build()
        );

        return new AuthResponse(
                accessToken,
                refreshToken,
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getLinkedinUrl(),
                savedUser.getDepartment()
        );
    }

    public AuthResponse refresh(RefreshRequest request) {
        RefreshToken savedToken = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (savedToken.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(savedToken);
            throw new RuntimeException("Refresh token expired");
        }

        User user = savedToken.getUser();
        String accessToken = jwtService.generateAccessToken(user);

        return new AuthResponse(
                accessToken,
                savedToken.getToken(),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getLinkedinUrl(),
                user.getDepartment()
        );
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    public AuthResponse getMeFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized");
        }
        String token = authHeader.substring(7);
        String email = jwtService.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!jwtService.isValid(token, user)) {
            throw new RuntimeException("Token invalid or expired");
        }
        return new AuthResponse(
                token,
                null,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getLinkedinUrl(),
                user.getDepartment()
        );
    }

    @Transactional
    public AuthResponse updateProfileFromToken(String authHeader, String fullName, String linkedinUrl) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized");
        }
        String token = authHeader.substring(7);
        String email = jwtService.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!jwtService.isValid(token, user)) {
            throw new RuntimeException("Token invalid or expired");
        }
        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName);
        }
        user.setLinkedinUrl(linkedinUrl);
        User saved = userRepository.save(user);
        return new AuthResponse(
                token,
                null,
                saved.getId(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getLinkedinUrl(),
                saved.getDepartment()
        );
    }
}
