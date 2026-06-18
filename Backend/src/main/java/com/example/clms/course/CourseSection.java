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

    @Builder.Default
    private Integer duration = 0; // duration in seconds

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private CourseModule module;

    /**
     * For SCORM sections only: references scorm_packages.id
     * Null for VIDEO/PDF/PPT/DOCUMENT sections.
     */
    @Column(name = "scorm_package_id")
    private Long scormPackageId;
}

