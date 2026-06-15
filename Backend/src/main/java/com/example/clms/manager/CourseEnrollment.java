package com.example.clms.manager;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_enrollments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long courseId;
    private String employeeName;
    private String courseName;
    
    private int progress; // percentage (0 - 100)
    private String status; // "Compliant", "At Risk", "Non-Compliant", "Completed", "In Progress"
    private int quizScore; // percentage (0 - 100)
    
    private LocalDateTime enrolledAt;
    private LocalDateTime completedAt;
    private LocalDateTime dueDate;
}
