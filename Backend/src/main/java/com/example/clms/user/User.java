package com.example.clms.user;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;



    @Enumerated(EnumType.STRING)
    private Role role;

    private boolean active = true;
    
    private String department;
    private String designation;
    
    @Builder.Default
    private String status = "Compliant"; // Compliant, At Risk, Non-Compliant

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "fcm_token")
    private String fcmToken;

    public String getEmail() { return email; }
    public Role getRole() { return role; }
    public Long getId() { return id; }
    public String getPassword() {return password ;}
    public String getFullName(){return fullName;}
    public String getDepartment() { return department; }
    public String getDesignation() { return designation; }
    public String getStatus() { return status; }
    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }
    public String getFcmToken() { return fcmToken; }
    public void setFcmToken(String fcmToken) { this.fcmToken = fcmToken; }
}