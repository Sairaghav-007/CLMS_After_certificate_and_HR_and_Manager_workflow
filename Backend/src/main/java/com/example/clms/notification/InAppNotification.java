package com.example.clms.notification;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "in_app_notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InAppNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long employeeId;
    private String title;

    @Column(length = 2048)
    private String message;

    private String type; // course_assigned, due_date_reminder, learning_path, course_removed

    private String courseId;

    @Builder.Default
    private boolean isRead = false;

    private LocalDateTime createdAt;
}
