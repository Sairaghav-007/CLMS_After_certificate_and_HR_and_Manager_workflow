package com.example.clms.course;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "certificate_path_or_url", length = 1024)
    private String certificatePathOrUrl;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    private String certificateNumber;
    private String qrCodeData;
    private String verificationUrl;
}
