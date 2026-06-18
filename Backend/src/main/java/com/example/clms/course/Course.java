package com.example.clms.course;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String category;

    @Column(length = 4096)
    private String description;

    private LocalDate dueDate;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private String status = "PUBLISHED"; // Default to PUBLISHED for existing seed data, HR creates as DRAFT/PENDING_MANAGER_REVIEW

    private String createdBy;
    
    @Builder.Default
    private int passingScore = 70;
    
    @Builder.Default
    private int maxAttempts = 3;
    
    @Builder.Default
    private int duration = 10; // in hours
    
    @Column(columnDefinition = "TEXT")
    private String thumbnail;
    private String department;

    private LocalDate startDate;
    private LocalDate endDate;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "course_objectives", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "objective", length = 1024)
    @Builder.Default
    private List<String> objectives = new java.util.ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "course_learning_outcomes", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "outcome", length = 1024)
    @Builder.Default
    private List<String> learningOutcomes = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("moduleOrder ASC")
    private List<CourseModule> modules;
}
