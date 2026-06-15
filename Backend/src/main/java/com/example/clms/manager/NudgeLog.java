package com.example.clms.manager;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nudge_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NudgeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long managerId;
    private Long employeeId;
    private Long courseId;
    private String employeeName;
    private String courseName;
    
    @Column(length = 2048)
    private String message;
    
    private LocalDateTime sentAt;
}
