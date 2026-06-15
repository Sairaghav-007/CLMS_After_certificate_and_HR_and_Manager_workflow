package com.example.clms.course;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "progress_percentage", nullable = false)
    private int progressPercentage;

    @Column(name = "completed", nullable = false)
    private boolean completed;

    @Column(name = "last_accessed")
    private LocalDateTime lastAccessed;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // Assessment related progress fields
    private int attemptsUsed;
    private boolean isPassed;
    private Integer lastScore;
}
