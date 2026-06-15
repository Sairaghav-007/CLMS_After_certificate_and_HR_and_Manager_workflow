package com.example.clms.admin;

import com.example.clms.user.User;
import com.example.clms.user.Role;
import com.example.clms.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/roles")
public class AdminUserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public static class AccountDto {
        public String uniqueId;
        public String email;
        public String firstName;
        public String middleName;
        public String lastName;
        public String role;
        public int joiningYear;

        public AccountDto() {}

        public AccountDto(User user) {
            this.uniqueId = String.valueOf(user.getId());
            this.email = user.getEmail();
            this.joiningYear = 2026;
            
            // Map Role enum to UI Role display string
            if (user.getRole() == Role.ADMIN) {
                this.role = "Administrator";
            } else if (user.getRole() == Role.HR) {
                this.role = "HR Manager";
            } else if (user.getRole() == Role.MANAGER) {
                this.role = "Department Manager";
            } else {
                this.role = "Employee";
            }

            // Split fullName
            String fullName = user.getFullName() != null ? user.getFullName().trim() : "";
            String[] parts = fullName.split("\\s+");
            if (parts.length > 0) {
                this.firstName = parts[0];
            } else {
                this.firstName = "";
            }
            if (parts.length > 2) {
                this.middleName = parts[1];
                StringBuilder sb = new StringBuilder();
                for (int i = 2; i < parts.length; i++) {
                    sb.append(parts[i]).append(" ");
                }
                this.lastName = sb.toString().trim();
            } else if (parts.length == 2) {
                this.middleName = "";
                this.lastName = parts[1];
            } else {
                this.middleName = "";
                this.lastName = "";
            }
        }
    }

    @GetMapping
    public List<AccountDto> getAllAccounts() {
        return userRepository.findAll().stream()
                .map(AccountDto::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountDto> getAccountById(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        return userOpt.map(user -> ResponseEntity.ok(new AccountDto(user)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public AccountDto createAccount(@RequestBody AccountDto dto) {
        // Map UI role display string to Role enum
        Role roleEnum = Role.EMPLOYEE;
        if ("Administrator".equalsIgnoreCase(dto.role)) {
            roleEnum = Role.ADMIN;
        } else if ("HR Manager".equalsIgnoreCase(dto.role)) {
            roleEnum = Role.HR;
        } else if ("Department Manager".equalsIgnoreCase(dto.role)) {
            roleEnum = Role.MANAGER;
        }

        String fullName = (dto.firstName + " " + dto.middleName + " " + dto.lastName).replaceAll("\\s+", " ").trim();
        
        User user = User.builder()
                .fullName(fullName)
                .email(dto.email)
                .password(passwordEncoder.encode("password123")) // default password
                .role(roleEnum)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        return new AccountDto(savedUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountDto> updateAccount(@PathVariable Long id, @RequestBody AccountDto dto) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Map UI role display string to Role enum
            Role roleEnum = Role.EMPLOYEE;
            if ("Administrator".equalsIgnoreCase(dto.role)) {
                roleEnum = Role.ADMIN;
            } else if ("HR Manager".equalsIgnoreCase(dto.role)) {
                roleEnum = Role.HR;
            } else if ("Department Manager".equalsIgnoreCase(dto.role)) {
                roleEnum = Role.MANAGER;
            }

            String fullName = (dto.firstName + " " + dto.middleName + " " + dto.lastName).replaceAll("\\s+", " ").trim();
            
            user.setFullName(fullName);
            user.setEmail(dto.email);
            user.setRole(roleEnum);
            
            User updatedUser = userRepository.save(user);
            return ResponseEntity.ok(new AccountDto(updatedUser));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
