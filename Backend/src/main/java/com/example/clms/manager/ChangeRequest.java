package com.example.clms.manager;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "change_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long courseId;
    private String title;
    
    @Column(length = 4096)
    private String feedback;
    
    private String priority; // "Low", "Medium", "High"
    private LocalDateTime timestamp;
    private boolean resolved;
}
