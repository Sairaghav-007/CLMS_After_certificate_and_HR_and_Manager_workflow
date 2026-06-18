package com.example.clms.scorm;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scorm_runtime_data",
       uniqueConstraints = @UniqueConstraint(columnNames = {"employee_id", "section_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScormRuntimeData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "section_id", nullable = false)
    private Long sectionId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    /**
     * SCORM lesson_status: "not attempted" | "incomplete" | "completed" | "passed" | "failed"
     */
    @Builder.Default
    @Column(name = "lesson_status", length = 64)
    private String lessonStatus = "not attempted";

    /**
     * Raw score (0-100)
     */
    @Column(name = "score_raw")
    private Integer scoreRaw;

    /**
     * cmi.suspend_data — up to 4096 chars
     */
    @Column(name = "suspend_data", length = 4096)
    private String suspendData;

    /**
     * cmi.core.lesson_location (SCORM 1.2) or cmi.location (SCORM 2004)
     */
    @Column(name = "lesson_location", length = 512)
    private String lessonLocation;

    /**
     * cmi.core.exit (SCORM 1.2) or cmi.exit (SCORM 2004)
     * e.g. "suspend" | "logout" | "normal" | ""
     */
    @Column(name = "exit_value", length = 64)
    private String exitValue;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
