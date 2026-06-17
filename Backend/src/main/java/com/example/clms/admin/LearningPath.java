package com.example.clms.admin;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "learning_paths")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningPath {
    @Id
    private String id;
    private String name;
    private String description;
    private int duration; // in hours
    private String department;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "learning_path_courses", joinColumns = @JoinColumn(name = "path_id"))
    @Column(name = "course_id")
    private java.util.List<Long> courseIds = new java.util.ArrayList<>();
}
