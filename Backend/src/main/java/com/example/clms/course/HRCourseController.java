package com.example.clms.course;

import com.example.clms.user.User;
import com.example.clms.user.UserRepository;
import com.example.clms.user.Notification;
import com.example.clms.user.NotificationRepository;
import com.example.clms.manager.AuditLog;
import com.example.clms.manager.AuditLogRepository;
import com.example.clms.manager.ChangeRequest;
import com.example.clms.manager.ChangeRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HRCourseController {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final CourseContentRepository courseContentRepository;
    private final QuestionRepository questionRepository;

    private User getAuthenticatedUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("HR user not found"));
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Uploaded file is empty");
        }

        try {
            // Create uploads folder inside the workspace root if it doesn't exist
            String uploadsDir = "uploads";
            File directory = new File(uploadsDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String savedName = UUID.randomUUID().toString() + extension;
            java.nio.file.Path targetPath = Paths.get(uploadsDir).resolve(savedName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "http://localhost:8080/uploads/" + savedName;

            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("name", originalName);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
    }

    @PostMapping("/courses")
    @Transactional
    public ResponseEntity<Map<String, Object>> saveCourse(@RequestBody CourseSaveRequest req) {
        User hrUser = getAuthenticatedUser();
        
        // Find existing course by title or generate one (since we use UUIDs from frontend, let's see if it's numeric or numeric string, otherwise we generate a new DB ID)
        Course course = null;
        Long courseId = null;
        try {
            courseId = Long.parseLong(req.id);
            course = courseRepository.findById(courseId).orElse(null);
        } catch (NumberFormatException e) {
            // ID is UUID string, look up by title
            course = courseRepository.findByTitleIgnoreCase(req.title).stream().findFirst().orElse(null);
        }

        boolean isNew = (course == null);
        if (isNew) {
            course = Course.builder()
                    .title(req.title)
                    .category(req.category)
                    .description(req.description)
                    .dueDate(LocalDate.now().plusDays(30))
                    .active("Published".equalsIgnoreCase(req.status))
                    .status(req.status != null ? req.status : "Draft")
                    .createdBy(hrUser.getFullName())
                    .passingScore(req.passingScore > 0 ? req.passingScore : 70)
                    .maxAttempts(req.maxAttempts > 0 ? req.maxAttempts : 3)
                    .duration(req.duration > 0 ? req.duration : 10)
                    .department(req.department != null ? req.department : "Engineering")
                    .modules(new ArrayList<>())
                    .build();
        } else {
            course.setTitle(req.title);
            course.setCategory(req.category);
            course.setDescription(req.description);
            course.setStatus(req.status != null ? req.status : course.getStatus());
            if ("Published".equalsIgnoreCase(req.status)) {
                course.setActive(true);
            }
            course.setPassingScore(req.passingScore > 0 ? req.passingScore : course.getPassingScore());
            course.setMaxAttempts(req.maxAttempts > 0 ? req.maxAttempts : course.getMaxAttempts());
            course.setDuration(req.duration > 0 ? req.duration : course.getDuration());
            course.setDepartment(req.department != null ? req.department : course.getDepartment());
        }

        // Save course to generate ID
        Course savedCourse = courseRepository.save(course);
        final Course finalSavedCourse = savedCourse;

        // Clear existing modules and sections to recreate
        if (!isNew && savedCourse.getModules() != null) {
            savedCourse.getModules().clear();
            courseRepository.saveAndFlush(savedCourse);
        }

        // Recreate modules and sections
        List<CourseModule> modules = new ArrayList<>();
        if (req.modules != null) {
            for (int mIdx = 0; mIdx < req.modules.size(); mIdx++) {
                ModuleSaveRequest modReq = req.modules.get(mIdx);
                CourseModule module = CourseModule.builder()
                        .course(finalSavedCourse)
                        .title(modReq.title)
                        .moduleOrder(modReq.order > 0 ? modReq.order : mIdx + 1)
                        .sections(new ArrayList<>())
                        .build();

                List<CourseSection> sections = new ArrayList<>();
                if (modReq.sessions != null) {
                    for (int sIdx = 0; sIdx < modReq.sessions.size(); sIdx++) {
                        SessionSaveRequest sessReq = modReq.sessions.get(sIdx);
                        MaterialType matType = MaterialType.DOCUMENT;
                        String matUrl = "";

                        if ("Video".equalsIgnoreCase(sessReq.type)) {
                            matType = MaterialType.VIDEO;
                            matUrl = sessReq.videoUrl;
                        } else if ("PDF".equalsIgnoreCase(sessReq.type)) {
                            matType = MaterialType.PDF;
                            matUrl = sessReq.pdfUrl;
                        } else if ("PPT".equalsIgnoreCase(sessReq.type) || "PPTX".equalsIgnoreCase(sessReq.type)) {
                            matType = MaterialType.PPT;
                            matUrl = sessReq.pptUrl;
                        } else {
                            matUrl = sessReq.videoUrl != null ? sessReq.videoUrl : (sessReq.pdfUrl != null ? sessReq.pdfUrl : sessReq.pptUrl);
                        }

                        if (matUrl == null) matUrl = "";

                        CourseSection section = CourseSection.builder()
                                .module(module)
                                .title(sessReq.title)
                                .materialType(matType)
                                .materialUrl(matUrl)
                                .sectionOrder(sIdx + 1)
                                .build();

                        sections.add(section);

                        // Save details to course_contents table if it's an uploaded file
                        if (matUrl.contains("/uploads/")) {
                            String fileName = matUrl.substring(matUrl.lastIndexOf("/") + 1);
                            courseContentRepository.save(
                                    CourseContent.builder()
                                            .courseId(finalSavedCourse.getId())
                                            .fileName(fileName)
                                            .fileType(matType.name())
                                            .filePath(matUrl)
                                            .build()
                            );
                        }
                    }
                }
                module.setSections(sections);
                modules.add(module);
            }
        }

        // IMPORTANT: must mutate the existing managed collection in-place (not replace reference)
        // because Course.modules has orphanRemoval=true; swapping the list ref causes Hibernate error.
        if (savedCourse.getModules() == null) {
            savedCourse.setModules(new ArrayList<>());
        }
        savedCourse.getModules().clear();
        savedCourse.getModules().addAll(modules);
        savedCourse = courseRepository.save(savedCourse);

        // Seed basic questions if none exist
        if (questionRepository.findByCourseId(savedCourse.getId()).isEmpty()) {
            questionRepository.save(Question.builder().courseId(savedCourse.getId())
                    .question("What is the core target of learning " + savedCourse.getTitle() + "?")
                    .optionA("To gain knowledge and follow proper workplace procedures")
                    .optionB("To finish training with no operational changes")
                    .optionC("None of the above")
                    .optionD("All of the above")
                    .correctAnswer("A").build());
            questionRepository.save(Question.builder().courseId(savedCourse.getId())
                    .question("Reviewing corporate compliance training is a continuous requirement.")
                    .optionA("True")
                    .optionB("False")
                    .optionC("")
                    .optionD("")
                    .correctAnswer("A").build());
        }

        // Audit Log Entry
        AuditLog audit = AuditLog.builder()
                .courseId(savedCourse.getId())
                .username(hrUser.getFullName())
                .action(isNew ? "Course Created" : "Course Updated")
                .status(savedCourse.getStatus())
                .comment("Saved nesting draft via HR Portal.")
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(audit);

        Map<String, Object> response = new HashMap<>();
        response.put("id", String.valueOf(finalSavedCourse.getId()));
        response.put("title", finalSavedCourse.getTitle());
        response.put("status", finalSavedCourse.getStatus());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/courses")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getHrCourses() {
        return courseRepository.findAll().stream()
                .map(c -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", String.valueOf(c.getId()));
                    map.put("title", c.getTitle());
                    map.put("description", c.getDescription() != null ? c.getDescription() : "");
                    map.put("category", c.getCategory() != null ? c.getCategory() : "Mandatory");
                    map.put("status", c.getStatus() != null ? c.getStatus() : "Draft");
                    map.put("createdBy", c.getCreatedBy() != null ? c.getCreatedBy() : "HR Specialist");
                    map.put("passingScore", c.getPassingScore());
                    map.put("maxAttempts", c.getMaxAttempts());
                    map.put("duration", c.getDuration());
                    map.put("department", c.getDepartment() != null ? c.getDepartment() : "Engineering");
                    map.put("thumbnail", c.getThumbnail() != null ? c.getThumbnail() : "");
                    
                    // Map change requests
                    List<ChangeRequest> changeReqs = changeRequestRepository.findByCourseId(c.getId());
                    List<Map<String, Object>> changeReqList = new ArrayList<>();
                    for (ChangeRequest cr : changeReqs) {
                        Map<String, Object> crMap = new HashMap<>();
                        crMap.put("id", String.valueOf(cr.getId()));
                        crMap.put("title", cr.getTitle());
                        crMap.put("feedback", cr.getFeedback());
                        crMap.put("priority", cr.getPriority());
                        crMap.put("timestamp", cr.getTimestamp().toString());
                        crMap.put("resolved", cr.isResolved());
                        changeReqList.add(crMap);
                    }
                    map.put("changeRequests", changeReqList);

                    // Map audit logs
                    List<AuditLog> audits = auditLogRepository.findByCourseId(c.getId());
                    List<Map<String, Object>> auditList = new ArrayList<>();
                    for (AuditLog audit : audits) {
                        Map<String, Object> auMap = new HashMap<>();
                        auMap.put("id", String.valueOf(audit.getId()));
                        auMap.put("action", audit.getAction());
                        auMap.put("user", audit.getUsername());
                        auMap.put("status", audit.getStatus());
                        auMap.put("comment", audit.getComment());
                        auMap.put("timestamp", audit.getTimestamp().toString());
                        auditList.add(auMap);
                    }
                    map.put("auditLogs", auditList);

                    // Map modules
                    List<Map<String, Object>> moduleList = new ArrayList<>();
                    if (c.getModules() != null) {
                        for (CourseModule mod : c.getModules()) {
                            Map<String, Object> modMap = new HashMap<>();
                            modMap.put("id", String.valueOf(mod.getId()));
                            modMap.put("title", mod.getTitle());
                            modMap.put("order", mod.getModuleOrder());
                            
                            // Map sections to sessions
                            List<Map<String, Object>> sessionList = new ArrayList<>();
                            if (mod.getSections() != null) {
                                for (CourseSection sec : mod.getSections()) {
                                    Map<String, Object> secMap = new HashMap<>();
                                    secMap.put("id", String.valueOf(sec.getId()));
                                    secMap.put("title", sec.getTitle());
                                    
                                    String typeStr = "Video";
                                    if (sec.getMaterialType() == MaterialType.PDF) typeStr = "PDF";
                                    else if (sec.getMaterialType() == MaterialType.PPT) typeStr = "PPT";
                                    
                                    secMap.put("type", typeStr);
                                    secMap.put("duration", 120); // Default duration in seconds
                                    secMap.put("order", sec.getSectionOrder());
                                    secMap.put("videoUrl", sec.getMaterialUrl());
                                    secMap.put("pdfUrl", sec.getMaterialUrl());
                                    secMap.put("pptUrl", sec.getMaterialUrl());
                                    sessionList.add(secMap);
                                }
                            }
                            modMap.put("sessions", sessionList);
                            moduleList.add(modMap);
                        }
                    }
                    map.put("modules", moduleList);
                    return map;
                })
                .toList();
    }

    @GetMapping("/notifications")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getNotifications() {
        User hrUser = getAuthenticatedUser();
        List<Notification> list = notificationRepository.findByReceiverIdOrderByCreatedAtDesc(hrUser.getId());
        
        return list.stream()
                .map(n -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", String.valueOf(n.getId()));
                    map.put("type", n.getType());
                    map.put("courseId", String.valueOf(n.getCourseId()));
                    map.put("courseTitle", n.getCourseTitle());
                    map.put("message", n.getMessage());
                    map.put("read", n.isRead());
                    map.put("timestamp", n.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                    map.put("linkTo", "/hr/review-courses/" + n.getCourseId());
                    return map;
                })
                .toList();
    }

    @PostMapping("/notifications/{id}/read")
    @Transactional
    public ResponseEntity<Void> markNotificationRead(@PathVariable Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.ok().build();
    }

    public static class CourseSaveRequest {
        public String id;
        public String title;
        public String description;
        public String category;
        public int duration;
        public int passingScore;
        public int maxAttempts;
        public String department;
        public String status;
        public List<ModuleSaveRequest> modules;
    }

    public static class ModuleSaveRequest {
        public String id;
        public String title;
        public int order;
        public List<SessionSaveRequest> sessions;
    }

    public static class SessionSaveRequest {
        public String id;
        public String title;
        public String type;
        public String videoUrl;
        public String pdfUrl;
        public String pptUrl;
        public int duration;
    }
}
