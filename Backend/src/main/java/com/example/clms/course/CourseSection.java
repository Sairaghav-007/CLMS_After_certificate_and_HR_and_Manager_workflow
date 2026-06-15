package com.example.clms.course;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course_sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Enumerated(EnumType.STRING)
    private MaterialType materialType;

    @Column(name = "material_url", length = 2048, nullable = false)
    private String materialUrl;

    private Integer sectionOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private CourseModule module;
}
