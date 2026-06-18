package com.example.clms.course;

import com.example.clms.user.User;
import com.example.clms.user.UserRepository;
import com.example.clms.notification.InAppNotification;
import com.example.clms.notification.InAppNotificationRepository;
import com.example.clms.manager.NudgeLog;
import com.example.clms.manager.NudgeLogRepository;
import com.example.clms.scorm.ScormPackage;
import com.example.clms.scorm.ScormPackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/employee")
@RequiredArgsConstructor
public class EmployeeCourseController {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final CourseSectionProgressRepository courseSectionProgressRepository;
    private final CertificateRepository certificateRepository;
    private final QuestionRepository questionRepository;
    private final InAppNotificationRepository inAppNotificationRepository;
    private final NudgeLogRepository nudgeLogRepository;
    private final ScormPackageRepository scormPackageRepository;

    private User getAuthenticatedUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged in user not found: " + email));
    }

    private void checkCourseAccess(User employee, Course course) {
        if ("Department-Oriented".equalsIgnoreCase(course.getCategory())) {
            String empDept = employee.getDepartment();
            String courseDept = course.getDepartment();
            if (empDept == null || !empDept.equalsIgnoreCase(courseDept)) {
                throw new RuntimeException("Access denied: This course is for the " + courseDept + " department.");
            }
        }
    }

    @GetMapping("/courses")
    @Transactional(readOnly = true)
    public List<CourseSummaryResponse> getCourses(@RequestParam(required = false) String search) {
        User employee = getAuthenticatedUser();
        List<Course> courses = search != null && !search.isBlank()
                ? courseRepository.findByActiveTrueAndTitleContainingIgnoreCase(search)
                : courseRepository.findByActiveTrue();

        return courses.stream()
                .filter(course -> "PUBLISHED".equalsIgnoreCase(course.getStatus()) || "READY_TO_PUBLISH".equalsIgnoreCase(course.getStatus()))
                .filter(course -> {
                    // Department-Oriented courses: only visible to matching department
                    if ("Department-Oriented".equalsIgnoreCase(course.getCategory())) {
                        String empDept = employee.getDepartment();
                        String courseDept = course.getDepartment();
                        return empDept != null && empDept.equalsIgnoreCase(courseDept);
                    }
                    // Mandatory / Elective courses visible to all
                    return true;
                })
                .map(course -> {
                    CourseProgress progress = courseProgressRepository.findByEmployeeIdAndCourseId(employee.getId(), course.getId())
                            .orElse(null);
                    int progressPercent = progress != null ? progress.getProgressPercentage() : 0;
                    String status = progress != null ? (progress.isCompleted() ? "COMPLETED" : progressPercent > 0 ? "IN_PROGRESS" : "NOT_STARTED") : "NOT_STARTED";
                    
                    return new CourseSummaryResponse(
                            course.getId(),
                            course.getTitle(),
                            course.getCategory(),
                            course.getDescription(),
                            course.getDueDate(),
                            progressPercent,
                            status,
                            course.getThumbnail() != null ? course.getThumbnail() : ""
                    );
                })
                .toList();
    }

    @GetMapping("/courses/{id}")
    @Transactional(readOnly = true)
    public CourseDetailResponse getCourse(@PathVariable Long id) {
        User employee = getAuthenticatedUser();
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        checkCourseAccess(employee, course);

        CourseProgress courseProgress = courseProgressRepository.findByEmployeeIdAndCourseId(employee.getId(), id)
                .orElse(null);

        int progressPercent = courseProgress != null ? courseProgress.getProgressPercentage() : 0;
        String status = courseProgress != null ? (courseProgress.isCompleted() ? "COMPLETED" : progressPercent > 0 ? "IN_PROGRESS" : "NOT_STARTED") : "NOT_STARTED";

        // Map Certificate if exists
        Certificate cert = certificateRepository.findByEmployeeIdAndCourseId(employee.getId(), id)
                .orElse(null);
        CourseDetailResponse.CertificateResponse certResponse = null;
        if (cert != null) {
            certResponse = new CourseDetailResponse.CertificateResponse(
                    cert.getId(),
                    cert.getCertificateNumber(),
                    cert.getQrCodeData(),
                    cert.getVerificationUrl(),
                    cert.getIssuedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                    employee.getFullName(),
                    course.getTitle()
            );
        }

        // Map Questions for Assessment
        List<Question> questions = questionRepository.findByCourseId(id);
        List<CourseDetailResponse.QuestionResponse> questionResponses = questions.stream()
                .map(q -> {
                    List<CourseDetailResponse.OptionResponse> options = new ArrayList<>();
                    if (q.getOptionA() != null && !q.getOptionA().isBlank()) options.add(new CourseDetailResponse.OptionResponse("A", q.getOptionA()));
                    if (q.getOptionB() != null && !q.getOptionB().isBlank()) options.add(new CourseDetailResponse.OptionResponse("B", q.getOptionB()));
                    if (q.getOptionC() != null && !q.getOptionC().isBlank()) options.add(new CourseDetailResponse.OptionResponse("C", q.getOptionC()));
                    if (q.getOptionD() != null && !q.getOptionD().isBlank()) options.add(new CourseDetailResponse.OptionResponse("D", q.getOptionD()));

                    return new CourseDetailResponse.QuestionResponse(
                            String.valueOf(q.getId()),
                            options.size() == 2 ? "true_false" : "mcq",
                            q.getQuestion(),
                            options,
                            List.of(q.getCorrectAnswer()),
                            5
                    );
                })
                .toList();

        // Calculate if modules are locked
        List<CourseSectionProgress> sectionProgresses = courseSectionProgressRepository.findByEmployeeIdAndCourseId(employee.getId(), id);
        
        List<CourseDetailResponse.ModuleResponse> moduleResponses = new ArrayList<>();
        boolean previousModuleCompleted = true; // First module is always unlocked

        List<CourseModule> sortedModules = new ArrayList<>(course.getModules());
        sortedModules.sort(Comparator.comparing(CourseModule::getModuleOrder, Comparator.nullsLast(Integer::compareTo)));

        for (int i = 0; i < sortedModules.size(); i++) {
            CourseModule module = sortedModules.get(i);
            
            List<CourseSection> sortedSections = new ArrayList<>(module.getSections());
            sortedSections.sort(Comparator.comparing(CourseSection::getSectionOrder, Comparator.nullsLast(Integer::compareTo)));

            List<CourseDetailResponse.SectionResponse> sectionResponses = new ArrayList<>();
            int completedSectionsCount = 0;
            
            for (CourseSection section : sortedSections) {
                CourseSectionProgress secProg = sectionProgresses.stream()
                        .filter(sp -> sp.getSectionId().equals(section.getId()))
                        .findFirst()
                        .orElse(null);

                int secProgress = secProg != null ? secProg.getProgress() : 0;
                boolean secCompleted = secProg != null && secProg.isCompleted();
                if (secCompleted) {
                    completedSectionsCount++;
                }

                String scormPackageUuid = null;
                String scormEntryPath = null;
                String scormVersion = null;

                if (section.getMaterialType() == MaterialType.SCORM && section.getScormPackageId() != null) {
                    Optional<ScormPackage> pkgOpt = scormPackageRepository.findById(section.getScormPackageId());
                    if (pkgOpt.isPresent()) {
                        ScormPackage pkg = pkgOpt.get();
                        scormPackageUuid = pkg.getPackageUuid();
                        scormEntryPath = pkg.getEntryPath();
                        scormVersion = pkg.getVersion();
                    }
                }

                sectionResponses.add(new CourseDetailResponse.SectionResponse(
                        section.getId(),
                        section.getTitle(),
                        section.getMaterialType(),
                        section.getMaterialUrl(),
                        section.getSectionOrder(),
                        secProgress,
                        secCompleted,
                        section.getDuration() != null ? section.getDuration() : 0,
                        calculateTotalPages(section.getMaterialUrl(), section.getMaterialType()),
                        scormPackageUuid,
                        scormEntryPath,
                        scormVersion
                ));
            }

            int moduleCompletionPercent = sortedSections.isEmpty() ? 100 : (completedSectionsCount * 100) / sortedSections.size();
            boolean isModuleCompleted = moduleCompletionPercent == 100;
            boolean isLocked = i > 0 && !previousModuleCompleted;

            moduleResponses.add(new CourseDetailResponse.ModuleResponse(
                    module.getId(),
                    module.getTitle(),
                    module.getModuleOrder(),
                    moduleCompletionPercent,
                    isModuleCompleted,
                    isLocked,
                    sectionResponses
            ));

            previousModuleCompleted = isModuleCompleted;
        }

        // Assessment status
        boolean allModulesCompleted = moduleResponses.stream().allMatch(CourseDetailResponse.ModuleResponse::isCompleted);
        CourseDetailResponse.AssessmentResponse assessmentResponse = new CourseDetailResponse.AssessmentResponse(
                "AST-" + course.getId(),
                course.getTitle() + " Final Quiz",
                15,
                80,
                course.getMaxAttempts(),
                courseProgress != null ? courseProgress.getAttemptsUsed() : 0,
                !allModulesCompleted,
                courseProgress != null && courseProgress.isPassed(),
                courseProgress != null ? courseProgress.getLastScore() : null,
                questionResponses
        );

        return new CourseDetailResponse(
                course.getId(),
                course.getTitle(),
                course.getCategory(),
                course.getDescription(),
                course.getDueDate(),
                course.getStartDate(),
                course.getEndDate(),
                course.getCreatedBy() != null ? course.getCreatedBy() : "HR Specialist",
                course.getObjectives() != null ? course.getObjectives() : new ArrayList<>(),
                course.getLearningOutcomes() != null ? course.getLearningOutcomes() : new ArrayList<>(),
                progressPercent,
                status,
                certResponse,
                assessmentResponse,
                moduleResponses
        );
    }

    public static class ProgressUpdateRequest {
        public Long moduleId;
        public Long sectionId;
        public int progress;
    }

    @PostMapping("/courses/{courseId}/progress")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateProgress(
            @PathVariable Long courseId,
            @RequestBody ProgressUpdateRequest req
    ) {
        User employee = getAuthenticatedUser();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        checkCourseAccess(employee, course);

        // Save section progress
        CourseSectionProgress secProg = courseSectionProgressRepository
                .findByEmployeeIdAndCourseIdAndSectionId(employee.getId(), courseId, req.sectionId)
                .orElse(null);

        if (secProg == null) {
            secProg = CourseSectionProgress.builder()
                    .employeeId(employee.getId())
                    .courseId(courseId)
                    .sectionId(req.sectionId)
                    .progress(req.progress)
                    .completed(req.progress >= 100)
                    .lastAccessed(LocalDateTime.now())
                    .build();
        } else {
            secProg.setProgress(Math.max(secProg.getProgress(), req.progress));
            if (req.progress >= 100) {
                secProg.setCompleted(true);
            }
            secProg.setLastAccessed(LocalDateTime.now());
        }
        courseSectionProgressRepository.save(secProg);

        // Fetch course structure
        // Course is already fetched at the top of the method

        // Compute total sections and total completed sections
        int totalSections = 0;
        int completedSections = 0;

        List<CourseSectionProgress> allSecProgress = courseSectionProgressRepository
                .findByEmployeeIdAndCourseId(employee.getId(), courseId);

        for (CourseModule m : course.getModules()) {
            for (CourseSection s : m.getSections()) {
                totalSections++;
                boolean isCompleted = allSecProgress.stream()
                        .anyMatch(sp -> sp.getSectionId().equals(s.getId()) && sp.isCompleted());
                if (isCompleted) {
                    completedSections++;
                }
            }
        }

        int overallProgressPercent = totalSections == 0 ? 100 : (completedSections * 100) / totalSections;

        // Update course progress
        CourseProgress progress = courseProgressRepository.findByEmployeeIdAndCourseId(employee.getId(), courseId)
                .orElse(null);

        if (progress == null) {
            progress = CourseProgress.builder()
                    .employeeId(employee.getId())
                    .courseId(courseId)
                    .progressPercentage(overallProgressPercent)
                    .completed(overallProgressPercent >= 100)
                    .lastAccessed(LocalDateTime.now())
                    .build();
        } else {
            progress.setProgressPercentage(Math.max(progress.getProgressPercentage(), overallProgressPercent));
            if (overallProgressPercent >= 100) {
                progress.setCompleted(true);
                if (progress.getCompletedAt() == null) {
                    progress.setCompletedAt(LocalDateTime.now());
                }
            }
            progress.setLastAccessed(LocalDateTime.now());
        }
        courseProgressRepository.save(progress);

        Map<String, Object> response = new HashMap<>();
        response.put("progress", progress.getProgressPercentage());
        response.put("status", progress.isCompleted() ? "COMPLETED" : "IN_PROGRESS");
        return ResponseEntity.ok(response);
    }

    public static class AssessmentSubmitRequest {
        public int score;
        public String employeeName;
    }

    @PostMapping("/courses/{courseId}/assessment")
    @Transactional
    public ResponseEntity<Map<String, Object>> submitAssessment(
            @PathVariable Long courseId,
            @RequestBody AssessmentSubmitRequest req
    ) {
        User employee = getAuthenticatedUser();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        checkCourseAccess(employee, course);

        CourseProgress progress = courseProgressRepository.findByEmployeeIdAndCourseId(employee.getId(), courseId)
                .orElse(null);

        if (progress == null) {
            progress = CourseProgress.builder()
                    .employeeId(employee.getId())
                    .courseId(courseId)
                    .progressPercentage(100) // Assumed completed if doing assessment
                    .completed(true)
                    .completedAt(LocalDateTime.now())
                    .lastAccessed(LocalDateTime.now())
                    .build();
        }

        progress.setAttemptsUsed(progress.getAttemptsUsed() + 1);
        progress.setLastScore(req.score);

        boolean isPassed = req.score >= course.getPassingScore();
        if (isPassed) {
            progress.setPassed(true);
        }
        courseProgressRepository.save(progress);

        // Generate certificate
        CertificateResponseDto certResponse = null;
        if (isPassed) {
            Certificate cert = certificateRepository.findByEmployeeIdAndCourseId(employee.getId(), courseId)
                    .orElse(null);

            if (cert == null) {
                cert = Certificate.builder()
                        .employeeId(employee.getId())
                        .courseId(courseId)
                        .issuedAt(LocalDateTime.now())
                        .certificateNumber("CERT-" + courseId + "-" + (100000 + new Random().nextInt(900000)))
                        .qrCodeData("https://verify.acmecorp.com/certificates/" + courseId)
                        .verificationUrl("https://verify.acmecorp.com/certificates/" + courseId)
                        .build();
                certificateRepository.save(cert);
            }

            certResponse = new CertificateResponseDto(
                    cert.getId(),
                    cert.getCertificateNumber(),
                    cert.getQrCodeData(),
                    cert.getVerificationUrl(),
                    cert.getIssuedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                    employee.getFullName(),
                    course.getTitle()
            );
        }

        Map<String, Object> response = new HashMap<>();
        response.put("score", req.score);
        response.put("isPassed", isPassed);
        response.put("attemptsUsed", progress.getAttemptsUsed());
        response.put("certificate", certResponse);
        return ResponseEntity.ok(response);
    }

    public record CertificateResponseDto(
            Long id,
            String certificateNumber,
            String qrCodeData,
            String verificationUrl,
            String issuedAt,
            String employeeName,
            String courseName
    ) {}

    /**
     * Proxy endpoint: fetches any PDF by URL server-side and streams it to the browser.
     * This bypasses CORS restrictions on external CDN-hosted PDF files.
     */
    @GetMapping("/proxy/pdf")
    public ResponseEntity<byte[]> proxyPdf(@RequestParam String url) {
        try {
            // If it's a local /uploads/ path, read from disk
            if (url.contains("/uploads/")) {
                String fileName = url.substring(url.lastIndexOf("/") + 1);
                java.io.File file = new java.io.File("uploads/" + fileName);
                if (file.exists() && file.isFile()) {
                    byte[] bytes = java.nio.file.Files.readAllBytes(file.toPath());
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_PDF);
                    headers.setContentLength(bytes.length);
                    return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
                }
            }
            // Fetch external URL (CloudFront, S3, etc.) server-side — no CORS issue
            URL pdfUrl = new URL(url);
            URLConnection connection = pdfUrl.openConnection();
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(30000);
            connection.setRequestProperty("User-Agent", "Mozilla/5.0");
            try (InputStream in = connection.getInputStream()) {
                byte[] bytes = in.readAllBytes();
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentLength(bytes.length);
                return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(("Failed to fetch PDF: " + e.getMessage()).getBytes());
        }
    }

    @GetMapping("/certificates")
    @Transactional(readOnly = true)
    public List<CertificateResponseDto> getCertificates() {
        User employee = getAuthenticatedUser();
        List<Certificate> certs = certificateRepository.findByEmployeeId(employee.getId());
        
        return certs.stream()
                .map(cert -> {
                    Course course = courseRepository.findById(cert.getCourseId()).orElse(null);
                    String courseTitle = course != null ? course.getTitle() : "Competency Training";
                    return new CertificateResponseDto(
                            cert.getId(),
                            cert.getCertificateNumber(),
                            cert.getQrCodeData(),
                            cert.getVerificationUrl(),
                            cert.getIssuedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                            employee.getFullName(),
                            courseTitle
                    );
                })
                .toList();
    }

    private int calculateTotalPages(String materialUrl, MaterialType type) {
        if (materialUrl == null || materialUrl.isBlank()) {
            return 1;
        }
        if (materialUrl.contains("/uploads/")) {
            String fileName = materialUrl.substring(materialUrl.lastIndexOf("/") + 1);
            java.io.File file = new java.io.File("uploads/" + fileName);
            if (file.exists() && file.isFile()) {
                if (type == MaterialType.PDF) {
                    try {
                        byte[] bytes = java.nio.file.Files.readAllBytes(file.toPath());
                        String content = new String(bytes, java.nio.charset.StandardCharsets.ISO_8859_1);
                        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("/Count\\s+(\\d+)");
                        java.util.regex.Matcher matcher = pattern.matcher(content);
                        int lastCount = 5;
                        while (matcher.find()) {
                            try {
                                lastCount = Integer.parseInt(matcher.group(1));
                            } catch (Exception ignored) {}
                        }
                        return lastCount;
                    } catch (Exception e) {
                        return 5;
                    }
                } else if (type == MaterialType.PPT) {
                    try (java.util.zip.ZipFile zipFile = new java.util.zip.ZipFile(file)) {
                        long slideCount = zipFile.stream()
                                .filter(entry -> entry.getName().startsWith("ppt/slides/slide") && entry.getName().endsWith(".xml"))
                                .count();
                        return slideCount > 0 ? (int) slideCount : 5;
                    } catch (Exception e) {
                        return 5;
                    }
                }
            }
        } else {
            if (materialUrl.contains("file_example_PPT_250kB.ppt")) {
                return 3;
            }
            if (materialUrl.contains("dummy.pdf")) {
                return 2;
            }
        }
        return 5;
    }

    // ── In-App Notifications (for NotificationStore) ─────────────────────────

    @GetMapping("/notifications")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getEmployeeNotifications() {
        User employee = getAuthenticatedUser();
        List<InAppNotification> list = inAppNotificationRepository.findByEmployeeIdOrderByCreatedAtDesc(employee.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (InAppNotification n : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", n.getId());
            map.put("title", n.getTitle());
            map.put("message", n.getMessage());
            map.put("type", n.getType());
            map.put("courseId", n.getCourseId());
            map.put("isRead", n.isRead());
            map.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/notifications/{id}/read")
    @Transactional
    public ResponseEntity<Void> markNotificationRead(@PathVariable Long id) {
        inAppNotificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            inAppNotificationRepository.save(n);
        });
        return ResponseEntity.ok().build();
    }

    @PostMapping("/notifications/read-all")
    @Transactional
    public ResponseEntity<Void> markAllNotificationsRead() {
        User employee = getAuthenticatedUser();
        List<InAppNotification> list = inAppNotificationRepository.findByEmployeeIdOrderByCreatedAtDesc(employee.getId());
        list.forEach(n -> n.setRead(true));
        inAppNotificationRepository.saveAll(list);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/nudges")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getEmployeeNudges() {
        User employee = getAuthenticatedUser();
        List<NudgeLog> nudges = nudgeLogRepository.findByEmployeeIdOrderBySentAtDesc(employee.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (NudgeLog n : nudges) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", n.getId());
            map.put("courseId", n.getCourseId());
            map.put("courseTitle", n.getCourseName());
            map.put("message", n.getMessage());
            map.put("timestamp", n.getSentAt() != null ? n.getSentAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }
}
