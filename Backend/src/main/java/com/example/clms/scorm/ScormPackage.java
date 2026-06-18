package com.example.clms.scorm;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scorm_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScormPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "section_id")
    private Long sectionId;

    /**
     * SCORM version detected from imsmanifest.xml: "1.2" or "2004"
     */
    @Column(name = "version", nullable = false)
    private String version;

    /**
     * Relative path to the launch file inside the extracted folder,
     * e.g. "index.html" or "scormcontent/index.html"
     */
    @Column(name = "entry_path", nullable = false)
    private String entryPath;

    /**
     * Absolute path to the extracted directory on disk:
     * e.g. "/app/scorm-packages/550e8400-e29b-..."
     */
    @Column(name = "extracted_dir", nullable = false, length = 1024)
    private String extractedDir;

    /**
     * UUID used as the URL-safe folder name in /scorm-serve/{packageUuid}/
     */
    @Column(name = "package_uuid", nullable = false, unique = true)
    private String packageUuid;

    @Column(name = "original_filename", length = 512)
    private String originalFilename;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;
}
