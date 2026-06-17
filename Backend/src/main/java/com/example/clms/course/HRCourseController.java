package com.example.clms.course;

import com.example.clms.user.User;
import com.example.clms.user.UserRepository;
import com.example.clms.user.Role;
import com.example.clms.user.Notification;
import com.example.clms.user.NotificationRepository;
import com.example.clms.notification.FcmService;
import com.example.clms.notification.NotificationService;
import com.example.clms.manager.AuditLog;
import com.example.clms.manager.AuditLogRepository;
import com.example.clms.manager.ChangeRequest;
import com.example.clms.manager.ChangeRequestRepository;
import com.example.clms.manager.SseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HRCourseController {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final FcmService fcmService;
    private final NotificationService notificationService;
    private final AuditLogRepository auditLogRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final CourseContentRepository courseContentRepository;
    private final QuestionRepository questionRepository;
    private final SseService sseService;

    private User getAuthenticatedUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("HR user not found"));
    }

    // ── SSE: HR real-time events ─────────────────────────────────────────────
    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamHrEvents() {
        return sseService.register();
    }

    // ── HR Dashboard live stats ──────────────────────────────────────────────
    @GetMapping("/dashboard")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getHrDashboard() {
        List<Course> all = courseRepository.findAll();

        long total    = all.size();
        long drafts   = all.stream().filter(c -> "DRAFT".equalsIgnoreCase(c.getStatus())).count();
        long pending  = all.stream().filter(c ->
                "PENDING_MANAGER_REVIEW".equalsIgnoreCase(c.getStatus()) ||
                "ON_REVIEW".equalsIgnoreCase(c.getStatus())).count();
        long approved = all.stream().filter(c ->
                "READY_TO_PUBLISH".equalsIgnoreCase(c.getStatus())).count();
        long published = all.stream().filter(c -> "PUBLISHED".equalsIgnoreCase(c.getStatus())).count();
        long needChanges = all.stream().filter(c ->
                "REJECTED".equalsIgnoreCase(c.getStatus())).count();

        // Recent audit logs (last 8)
        List<AuditLog> recentAudits = auditLogRepository.findAll().stream()
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .limit(8)
                .collect(Collectors.toList());

        List<Map<String, Object>> activities = recentAudits.stream().map(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", String.valueOf(a.getId()));
            m.put("title", a.getAction());
            m.put("description", "Course #" + a.getCourseId() + " — " + a.getStatus());
            m.put("type", a.getAction().toLowerCase().contains("publish") ? "publish"
                    : a.getAction().toLowerCase().contains("review") ? "review"
                    : a.getAction().toLowerCase().contains("edit") ? "edit" : "schedule");
            m.put("timestamp", a.getTimestamp().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            m.put("icon", a.getAction().toLowerCase().contains("publish") ? "BadgeCheck"
                    : a.getAction().toLowerCase().contains("review") ? "ClipboardCheck" : "FileEdit");
            m.put("user", a.getUsername());
            return m;
        }).collect(Collectors.toList());

        // Pending actions
        List<Map<String, Object>> pendingActions = new ArrayList<>();
        if (pending > 0) {
            Map<String, Object> pa = new HashMap<>();
            pa.put("id", "pa-review"); pa.put("title", "Courses Awaiting Manager Review");
            pa.put("description", pending + " course(s) submitted and waiting for manager approval.");
            pa.put("count", pending); pa.put("priority", "high");
            pa.put("actionLabel", "Review"); pa.put("actionType", "review");
            pendingActions.add(pa);
        }
        if (approved > 0) {
            Map<String, Object> pa = new HashMap<>();
            pa.put("id", "pa-publish"); pa.put("title", "Courses Ready to Publish");
            pa.put("description", approved + " course(s) approved and ready for publishing.");
            pa.put("count", approved); pa.put("priority", "high");
            pa.put("actionLabel", "Publish"); pa.put("actionType", "publish");
            pendingActions.add(pa);
        }
        if (needChanges > 0) {
            Map<String, Object> pa = new HashMap<>();
            pa.put("id", "pa-changes"); pa.put("title", "Courses Need Changes");
            pa.put("description", needChanges + " course(s) returned by manager with feedback.");
            pa.put("count", needChanges); pa.put("priority", "medium");
            pa.put("actionLabel", "View Details"); pa.put("actionType", "view");
            pendingActions.add(pa);
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalCourses", total);
        res.put("drafts", drafts);
        res.put("pendingReview", pending);
        res.put("approved", approved);
        res.put("published", published);
        res.put("needChanges", needChanges);
        res.put("recentActivities", activities);
        res.put("pendingActions", pendingActions);
        return ResponseEntity.ok(res);
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
        boolean wasPublishedBefore = !isNew && "PUBLISHED".equalsIgnoreCase(course.getStatus());
        // Only Published courses are active/visible to employees
        boolean isPublished = "PUBLISHED".equalsIgnoreCase(req.status);
        if (isNew) {
            course = Course.builder()
                    .title(req.title)
                    .category(req.category)
                    .description(req.description)
                    .dueDate(LocalDate.now().plusDays(30))
                    .active(isPublished)
                    .status(req.status != null ? req.status : "DRAFT")
                    .createdBy(hrUser.getFullName())
                    .passingScore(req.passingScore > 0 ? req.passingScore : 70)
                    .maxAttempts(req.maxAttempts > 0 ? req.maxAttempts : 3)
                    .duration(req.duration > 0 ? req.duration : 10)
                    .thumbnail(req.thumbnail)
                    .department(req.department != null ? req.department : "Engineering")
                    .modules(new ArrayList<>())
                    .build();
        } else {
            course.setTitle(req.title);
            course.setCategory(req.category);
            course.setDescription(req.description);
            course.setStatus(req.status != null ? req.status : course.getStatus());
            // active=true ONLY for Published; all other statuses keep active=false
            course.setActive(isPublished);
            course.setPassingScore(req.passingScore > 0 ? req.passingScore : course.getPassingScore());
            course.setMaxAttempts(req.maxAttempts > 0 ? req.maxAttempts : course.getMaxAttempts());
            course.setDuration(req.duration > 0 ? req.duration : course.getDuration());
            course.setDepartment(req.department != null ? req.department : course.getDepartment());
            if (req.thumbnail != null && !req.thumbnail.isBlank()) {
                course.setThumbnail(req.thumbnail);
            }
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
                                .duration(sessReq.duration > 0 ? sessReq.duration : 0)
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

        // If published, send FCM push notification to all active employees
        if (isPublished) {
            final Course publishedCourse = savedCourse;
            List<User> employees = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == com.example.clms.user.Role.EMPLOYEE && u.isActive())
                    .collect(java.util.stream.Collectors.toList());
            for (User emp : employees) {
                try {
                    notificationService.notifyEmployee(
                        emp,
                        "published",
                        "New Course Available",
                        "New Course has been assigned with name: " + publishedCourse.getTitle(),
                        String.valueOf(publishedCourse.getId())
                    );
                } catch (Exception e) {
                    System.err.println("[FCM] Failed to notify employee " + emp.getId() + ": " + e.getMessage());
                }
            }
        }

        boolean isUnpublished = wasPublishedBefore && !isPublished;
        if (isUnpublished) {
            final Course unpublishedCourse = savedCourse;
            List<User> employees = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == com.example.clms.user.Role.EMPLOYEE && u.isActive())
                    .collect(java.util.stream.Collectors.toList());
            for (User emp : employees) {
                try {
                    notificationService.notifyEmployee(
                        emp,
                        "course_removed",
                        "Course Unpublished",
                        "This course has been unpublished by the HR: \"" + unpublishedCourse.getTitle() + "\"",
                        null
                    );
                } catch (Exception e) {
                    System.err.println("[FCM] Failed to notify employee " + emp.getId() + " about unpublished course: " + e.getMessage());
                }
            }
        }

        // Broadcast real-time SSE event so HR/Manager queues refresh
        Map<String, Object> ssePayload = new HashMap<>();
        ssePayload.put("courseId", savedCourse.getId());
        ssePayload.put("courseTitle", savedCourse.getTitle());
        ssePayload.put("status", savedCourse.getStatus());
        ssePayload.put("action", isNew ? "COURSE_CREATED" : "COURSE_UPDATED");
        sseService.broadcast("course_update", ssePayload);

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
                    map.put("status", c.getStatus() != null ? c.getStatus() : "DRAFT");
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
                                    secMap.put("duration", sec.getDuration() != null ? sec.getDuration() : 0);
                                    secMap.put("order", sec.getSectionOrder());
                                    // Set only the appropriate URL field based on material type
                                    String url = sec.getMaterialUrl() != null ? sec.getMaterialUrl() : "";
                                    secMap.put("videoUrl", sec.getMaterialType() == MaterialType.VIDEO ? url : null);
                                    secMap.put("pdfUrl",   sec.getMaterialType() == MaterialType.PDF   ? url : null);
                                    secMap.put("pptUrl",   sec.getMaterialType() == MaterialType.PPT   ? url : null);
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

    // ── Submit course for manager review ─────────────────────────────────────
    @PostMapping("/courses/{courseId}/submit-review")
    @Transactional
    public ResponseEntity<Map<String, String>> submitForReview(@PathVariable Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        // Only allow transitioning from DRAFT or REJECTED
        if (!"DRAFT".equalsIgnoreCase(course.getStatus()) && !"REJECTED".equalsIgnoreCase(course.getStatus())) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Course status cannot be changed to pending review from: " + course.getStatus());
            return ResponseEntity.badRequest().body(err);
        }

        course.setStatus("PENDING_MANAGER_REVIEW");
        courseRepository.save(course);

        User hrUser = getAuthenticatedUser();
        AuditLog audit = AuditLog.builder()
                .courseId(courseId)
                .username(hrUser.getFullName())
                .action("Submitted for Manager Review")
                .status("PENDING_MANAGER_REVIEW")
                .comment("HR submitted course for manager review.")
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(audit);

        // Notify Manager
        User manager = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.MANAGER)
                .findFirst()
                .orElse(null);
        if (manager != null) {
            Notification notification = Notification.builder()
                    .senderId(hrUser.getId())
                    .receiverId(manager.getId())
                    .message("HR submitted course \"" + course.getTitle() + "\" for review.")
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .type("review_request")
                    .courseId(courseId)
                    .courseTitle(course.getTitle())
                    .build();
            notificationRepository.save(notification);

            if (manager.getFcmToken() != null && !manager.getFcmToken().trim().isEmpty()) {
                try {
                    Map<String, Object> fcmData = new HashMap<>();
                    fcmData.put("type", "review_request");
                    fcmData.put("courseId", String.valueOf(courseId));
                    fcmService.sendPushNotification(
                        manager.getFcmToken(), 
                        "New Course Submission", 
                        "HR has submitted course \"" + course.getTitle() + "\" for review.", 
                        fcmData
                    );
                } catch (Exception e) {
                    System.err.println("[FCM] Failed to send course submission push: " + e.getMessage());
                }
            }
        }

        // Broadcast SSE event
        Map<String, Object> ssePayload = new HashMap<>();
        ssePayload.put("courseId", courseId);
        ssePayload.put("courseTitle", course.getTitle());
        ssePayload.put("status", "PENDING_MANAGER_REVIEW");
        ssePayload.put("action", "SUBMITTED_FOR_REVIEW");
        sseService.broadcast("course_review", ssePayload);

        Map<String, String> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Course submitted for manager review.");
        return ResponseEntity.ok(res);
    }

    // ── Questions CRUD ────────────────────────────────────────────────────────
    @GetMapping("/courses/{courseId}/questions")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getQuestions(@PathVariable Long courseId) {
        List<Question> questions = questionRepository.findByCourseId(courseId);
        List<Map<String, Object>> result = questions.stream().map(q -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", q.getId());
            m.put("courseId", q.getCourseId());
            m.put("sectionId", q.getSectionId());
            m.put("question", q.getQuestion());
            m.put("optionA", q.getOptionA());
            m.put("optionB", q.getOptionB());
            m.put("optionC", q.getOptionC() != null ? q.getOptionC() : "");
            m.put("optionD", q.getOptionD() != null ? q.getOptionD() : "");
            m.put("correctAnswer", q.getCorrectAnswer());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    public static class QuestionSaveRequest {
        public Long id;
        public Long sectionId;
        public String question;
        public String optionA;
        public String optionB;
        public String optionC;
        public String optionD;
        public String correctAnswer;
    }

    @PostMapping("/courses/{courseId}/questions")
    @Transactional
    public ResponseEntity<Map<String, Object>> saveQuestions(
            @PathVariable Long courseId,
            @RequestBody List<QuestionSaveRequest> requests) {

        courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        List<Question> saved = new ArrayList<>();
        for (QuestionSaveRequest req : requests) {
            Question q;
            if (req.id != null) {
                q = questionRepository.findById(req.id).orElse(new Question());
            } else {
                q = new Question();
            }
            q.setCourseId(courseId);
            q.setSectionId(req.sectionId);
            q.setQuestion(req.question != null ? req.question : "");
            q.setOptionA(req.optionA != null ? req.optionA : "");
            q.setOptionB(req.optionB != null ? req.optionB : "");
            q.setOptionC(req.optionC != null ? req.optionC : "");
            q.setOptionD(req.optionD != null ? req.optionD : "");
            q.setCorrectAnswer(req.correctAnswer != null ? req.correctAnswer : "A");
            saved.add(questionRepository.save(q));
        }

        Map<String, Object> res = new HashMap<>();
        res.put("saved", saved.size());
        res.put("courseId", courseId);
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/courses/{courseId}/questions/{questionId}")
    @Transactional
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long courseId,
            @PathVariable Long questionId) {
        questionRepository.findById(questionId).ifPresent(q -> {
            if (q.getCourseId().equals(courseId)) {
                questionRepository.delete(q);
            }
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
        public String thumbnail;
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

