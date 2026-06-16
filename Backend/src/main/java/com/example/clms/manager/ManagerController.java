package com.example.clms.manager;

import com.example.clms.course.Course;
import com.example.clms.course.CourseRepository;
import com.example.clms.user.User;
import com.example.clms.user.Role;
import com.example.clms.user.UserRepository;
import com.example.clms.course.*;
import com.example.clms.user.Notification;
import com.example.clms.user.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/manager")
@CrossOrigin(origins = "*")
public class ManagerController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseEnrollmentRepository courseEnrollmentRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ChangeRequestRepository changeRequestRepository;

    @Autowired
    private NudgeLogRepository nudgeLogRepository;

    @Autowired
    private SseService sseService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CourseProgressRepository courseProgressRepository;

    @Autowired
    private CourseSectionProgressRepository courseSectionProgressRepository;

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private QuestionRepository questionRepository;

    // SSE Registration Endpoint
    @GetMapping(value = "/dashboard/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEvents() {
        return sseService.register();
    }

    private List<Course> getAssignedCoursesForEmployee(User emp, List<Course> activeCourses) {
        return activeCourses.stream()
                .filter(c -> "PUBLISHED".equalsIgnoreCase(c.getStatus()) || "READY_TO_PUBLISH".equalsIgnoreCase(c.getStatus()))
                .filter(c -> {
                    if ("Department-Oriented".equalsIgnoreCase(c.getCategory())) {
                        String empDept = emp.getDepartment();
                        String courseDept = c.getDepartment();
                        return empDept != null && empDept.equalsIgnoreCase(courseDept);
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    // Dashboard Stats / KPI Endpoint
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<User> employees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .collect(Collectors.toList());

        List<Course> activeCourses = courseRepository.findByActiveTrue();
        List<CourseProgress> allProgress = courseProgressRepository.findAll();
        List<Certificate> allCerts = certificateRepository.findAll();

        long totalMembers = employees.size();
        long totalAssigned = 0;
        long completed = 0;
        long inProgress = 0;
        long overdue = 0;

        java.time.LocalDate today = java.time.LocalDate.now();

        for (User emp : employees) {
            List<Course> empCourses = getAssignedCoursesForEmployee(emp, activeCourses);
            totalAssigned += empCourses.size();
            for (Course course : empCourses) {
                CourseProgress prog = allProgress.stream()
                        .filter(p -> p.getEmployeeId().equals(emp.getId()) && p.getCourseId().equals(course.getId()))
                        .findFirst()
                        .orElse(null);

                if (prog != null && prog.isCompleted()) {
                    completed++;
                } else {
                    if (prog != null && prog.getProgressPercentage() > 0) {
                        inProgress++;
                    }
                    if (course.getDueDate() != null && course.getDueDate().isBefore(today)) {
                        overdue++;
                    }
                }
            }
        }

        double avgScore = allProgress.stream()
                .filter(p -> p.getLastScore() != null && p.getLastScore() > 0)
                .mapToInt(CourseProgress::getLastScore)
                .average()
                .orElse(0.0);

        long completionRate = totalAssigned > 0
                ? Math.round(((double) completed / totalAssigned) * 100)
                : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTeamMembers", totalMembers);
        stats.put("assignedCourses", totalAssigned);
        stats.put("completedCourses", completed);
        stats.put("inProgressCourses", inProgress);
        stats.put("overdueEmployees", overdue);
        stats.put("teamCompletionRate", completionRate);
        stats.put("averageQuizScore", Math.round(avgScore));
        stats.put("certificatesEarned", allCerts.size());

        return ResponseEntity.ok(stats);
    }

    // Real-time Activity Logs (Direct Reports with course completion details)
    @GetMapping("/dashboard/activity")
    public ResponseEntity<List<Map<String, Object>>> getActivity() {
        List<User> employees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .collect(Collectors.toList());

        List<Course> activeCourses = courseRepository.findByActiveTrue();
        List<CourseProgress> allProgress = courseProgressRepository.findAll();

        List<Map<String, Object>> activity = new ArrayList<>();
        
        for (User emp : employees) {
            Map<String, Object> record = new HashMap<>();
            record.put("id", String.valueOf(emp.getId()));
            record.put("name", emp.getFullName());
            record.put("department", emp.getDepartment() != null ? emp.getDepartment() : "Engineering");
            record.put("designation", emp.getDesignation() != null ? emp.getDesignation() : "Software Engineer");
            
            List<Course> empCourses = getAssignedCoursesForEmployee(emp, activeCourses);
            long empCompleted = 0;
            for (Course course : empCourses) {
                boolean isComp = allProgress.stream()
                        .anyMatch(p -> p.getEmployeeId().equals(emp.getId()) && p.getCourseId().equals(course.getId()) && p.isCompleted());
                if (isComp) {
                    empCompleted++;
                }
            }

            record.put("completedCourses", empCompleted);
            record.put("assignedCourses", (long) empCourses.size());
            record.put("status", emp.getStatus());
            record.put("avatar", emp.getFullName() != null && !emp.getFullName().isEmpty() ? emp.getFullName().substring(0, 1) : "E");
            
            activity.add(record);
        }

        return ResponseEntity.ok(activity);
    }

    // Trend Progress Records
    @GetMapping("/dashboard/trend")
    public ResponseEntity<List<Map<String, Object>>> getTrend() {
        List<Map<String, Object>> trend = new ArrayList<>();
        List<CourseProgress> allProgress = courseProgressRepository.findAll();

        java.time.LocalDate today = java.time.LocalDate.now();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");

        for (int i = 5; i >= 0; i--) {
            java.time.LocalDate targetDate = today.minusMonths(i);
            String monthName = targetDate.format(monthFormatter);
            int year = targetDate.getYear();
            int monthValue = targetDate.getMonthValue();

            long compCount = allProgress.stream()
                    .filter(p -> p.isCompleted() && p.getCompletedAt() != null
                            && p.getCompletedAt().getYear() == year
                            && p.getCompletedAt().getMonthValue() == monthValue)
                    .count();

            long ipCount = allProgress.stream()
                    .filter(p -> !p.isCompleted() && p.getProgressPercentage() > 0 && p.getLastAccessed() != null
                            && p.getLastAccessed().getYear() == year
                            && p.getLastAccessed().getMonthValue() == monthValue)
                    .count();

            Map<String, Object> data = new HashMap<>();
            data.put("period", monthName);
            data.put("completed", compCount);
            data.put("inProgress", ipCount);
            trend.add(data);
        }

        return ResponseEntity.ok(trend);
    }

    // Compliance stats split
    @GetMapping("/compliance")
    public ResponseEntity<Map<String, Object>> getCompliance() {
        List<User> employees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .collect(Collectors.toList());

        long compliant = employees.stream().filter(e -> "Compliant".equalsIgnoreCase(e.getStatus())).count();
        long atRisk = employees.stream().filter(e -> "At Risk".equalsIgnoreCase(e.getStatus())).count();
        long nonCompliant = employees.stream().filter(e -> "Non-Compliant".equalsIgnoreCase(e.getStatus())).count();

        Map<String, Object> res = new HashMap<>();
        res.put("compliant", compliant);
        res.put("atRisk", atRisk);
        res.put("nonCompliant", nonCompliant);

        return ResponseEntity.ok(res);
    }

    // Get Full Course Detail for Manager Review
    @GetMapping("/course-detail/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getCourseDetail(@PathVariable("id") Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        Map<String, Object> result = new HashMap<>();
        result.put("id", String.valueOf(course.getId()));
        result.put("title", course.getTitle());
        result.put("description", course.getDescription() != null ? course.getDescription() : "");
        result.put("category", course.getCategory() != null ? course.getCategory() : "Mandatory");
        result.put("status", course.getStatus() != null ? course.getStatus() : "DRAFT");
        result.put("createdBy", course.getCreatedBy() != null ? course.getCreatedBy() : "HR");
        result.put("thumbnail", course.getThumbnail() != null ? course.getThumbnail() : "");
        result.put("passingScore", course.getPassingScore());
        result.put("maxAttempts", course.getMaxAttempts());
        result.put("duration", course.getDuration());
        result.put("department", course.getDepartment() != null ? course.getDepartment() : "");
        result.put("dueDate", course.getDueDate() != null ? course.getDueDate().toString() : "");

        // Questions
        List<Question> questions = questionRepository.findByCourseId(courseId);
        List<Map<String, Object>> questionList = new ArrayList<>();
        for (Question q : questions) {
            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", String.valueOf(q.getId()));
            qMap.put("question", q.getQuestion());
            qMap.put("optionA", q.getOptionA());
            qMap.put("optionB", q.getOptionB());
            qMap.put("optionC", q.getOptionC() != null ? q.getOptionC() : "");
            qMap.put("optionD", q.getOptionD() != null ? q.getOptionD() : "");
            qMap.put("correctAnswer", q.getCorrectAnswer());
            questionList.add(qMap);
        }
        result.put("questions", questionList);

        // Modules + Sections
        List<Map<String, Object>> moduleList = new ArrayList<>();
        if (course.getModules() != null) {
            List<CourseModule> sortedModules = new ArrayList<>(course.getModules());
            sortedModules.sort(Comparator.comparing(CourseModule::getModuleOrder, Comparator.nullsLast(Integer::compareTo)));
            for (CourseModule mod : sortedModules) {
                Map<String, Object> modMap = new HashMap<>();
                modMap.put("id", String.valueOf(mod.getId()));
                modMap.put("title", mod.getTitle());
                modMap.put("order", mod.getModuleOrder());
                List<Map<String, Object>> sectionList = new ArrayList<>();
                if (mod.getSections() != null) {
                    List<CourseSection> sortedSections = new ArrayList<>(mod.getSections());
                    sortedSections.sort(Comparator.comparing(CourseSection::getSectionOrder, Comparator.nullsLast(Integer::compareTo)));
                    for (CourseSection sec : sortedSections) {
                        Map<String, Object> secMap = new HashMap<>();
                        secMap.put("id", String.valueOf(sec.getId()));
                        secMap.put("title", sec.getTitle());
                        secMap.put("materialType", sec.getMaterialType() != null ? sec.getMaterialType().name() : "DOCUMENT");
                        secMap.put("materialUrl", sec.getMaterialUrl() != null ? sec.getMaterialUrl() : "");
                        secMap.put("sectionOrder", sec.getSectionOrder());
                        secMap.put("duration", sec.getDuration() != null ? sec.getDuration() : 0);
                        sectionList.add(secMap);
                    }
                }
                modMap.put("sections", sectionList);
                moduleList.add(modMap);
            }
        }
        result.put("modules", moduleList);

        return ResponseEntity.ok(result);
    }

    // List Courses Awaiting Review
    @GetMapping("/reviews")
    public ResponseEntity<List<Map<String, Object>>> getReviews() {
        // Fetch all courses in review pipeline; deduplicate by ID
        List<Course> courses = courseRepository.findAll().stream()
                .filter(c -> {
                    String s = c.getStatus();
                    return "PENDING_MANAGER_REVIEW".equalsIgnoreCase(s)
                            || "ON_REVIEW".equalsIgnoreCase(s)
                            || "REJECTED".equalsIgnoreCase(s);
                })
                .collect(Collectors.toMap(
                        Course::getId,
                        c -> c,
                        (a, b) -> a,      // keep first on duplicate
                        java.util.LinkedHashMap::new
                ))
                .values()
                .stream()
                .collect(Collectors.toList());

        List<Map<String, Object>> list = new ArrayList<>();
        for (Course c : courses) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", String.valueOf(c.getId()));
            item.put("courseId", String.valueOf(c.getId()));
            item.put("courseName", c.getTitle());
            item.put("authorName", c.getCreatedBy() != null ? c.getCreatedBy() : "HR Specialist");
            item.put("status", c.getStatus());
            item.put("modules", c.getModules() != null ? c.getModules().size() : 0);
            int totalSessions = c.getModules() != null ? c.getModules().stream()
                    .mapToInt(m -> m.getSections() != null ? m.getSections().size() : 0).sum() : 0;
            int videos = c.getModules() != null ? c.getModules().stream()
                    .flatMap(m -> m.getSections() != null ? m.getSections().stream() : java.util.stream.Stream.empty())
                    .mapToInt(s -> s.getMaterialType() == MaterialType.VIDEO ? 1 : 0).sum() : 0;
            int pdfs = c.getModules() != null ? c.getModules().stream()
                    .flatMap(m -> m.getSections() != null ? m.getSections().stream() : java.util.stream.Stream.empty())
                    .mapToInt(s -> s.getMaterialType() == MaterialType.PDF ? 1 : 0).sum() : 0;
            int ppts = c.getModules() != null ? c.getModules().stream()
                    .flatMap(m -> m.getSections() != null ? m.getSections().stream() : java.util.stream.Stream.empty())
                    .mapToInt(s -> s.getMaterialType() == MaterialType.PPT ? 1 : 0).sum() : 0;
            item.put("sessions", totalSessions);
            item.put("videos", videos);
            item.put("pdfs", pdfs);
            item.put("ppts", ppts);
            item.put("passingScore", c.getPassingScore());
            item.put("submittedDate", c.getDueDate() != null ? c.getDueDate().minusDays(30).toString() : "2026-06-12");
            item.put("metadata", c.getTitle() != null && !c.getTitle().isBlank());
            list.add(item);
        }

        return ResponseEntity.ok(list);
    }

    // Approve Course for Publishing
    @PostMapping("/reviews/{courseId}/approve")
    public ResponseEntity<Map<String, String>> approveCourse(@PathVariable Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        String nextStatus = "PENDING_MANAGER_REVIEW".equalsIgnoreCase(course.getStatus()) ? "ON_REVIEW" : "READY_TO_PUBLISH";
        course.setStatus(nextStatus);
        
        if ("READY_TO_PUBLISH".equals(nextStatus)) {
            course.setActive(true);
        }

        courseRepository.save(course);

        // Write Audit log
        AuditLog log = AuditLog.builder()
                .courseId(courseId)
                .username("Sarah Mitchell")
                .action("Course Approved")
                .status(nextStatus)
                .comment("Course review passed evaluation criteria.")
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);

        // Save real notification for HR
        User hrUser = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.HR)
                .findFirst()
                .orElse(null);
        Long hrUserId = hrUser != null ? hrUser.getId() : 2L;

        notificationRepository.save(
                Notification.builder()
                        .senderId(3L) // Manager Sarah Mitchell id
                        .receiverId(hrUserId)
                        .message("Manager approved \"" + course.getTitle() + "\"")
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .type("approved")
                        .courseId(courseId)
                        .courseTitle(course.getTitle())
                        .build()
        );

        // Broadcast Real-time Event
        Map<String, Object> payload = new HashMap<>();
        payload.put("courseId", courseId);
        payload.put("courseName", course.getTitle());
        payload.put("status", nextStatus);
        payload.put("action", "APPROVED");
        sseService.broadcast("course_review", payload);

        Map<String, String> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Course successfully updated to " + nextStatus);
        return ResponseEntity.ok(res);
    }

    // Request Changes / Reject Course
    public static class RejectRequest {
        public String changeTitle;
        public String comments;
        public String priority;
    }

    @PostMapping("/reviews/{courseId}/reject")
    @Transactional
    public ResponseEntity<Map<String, String>> rejectCourse(@PathVariable Long courseId, @RequestBody RejectRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        course.setStatus("REJECTED");
        courseRepository.save(course);

        // Create Change Request
        ChangeRequest cr = ChangeRequest.builder()
                .courseId(courseId)
                .title(request.changeTitle != null ? request.changeTitle : "Update Content")
                .feedback(request.comments != null ? request.comments : "Please fix formatting")
                .priority(request.priority != null ? request.priority : "Medium")
                .timestamp(LocalDateTime.now())
                .resolved(false)
                .build();
        changeRequestRepository.save(cr);

        // Write Audit log
        AuditLog log = AuditLog.builder()
                .courseId(courseId)
                .username("Sarah Mitchell")
                .action("Changes Requested")
                .status("REJECTED")
                .comment(request.comments)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);

        // Save real notification for HR
        User hrUser = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.HR)
                .findFirst()
                .orElse(null);
        Long hrUserId = hrUser != null ? hrUser.getId() : 2L;

        notificationRepository.save(
                Notification.builder()
                        .senderId(3L) // Manager Sarah Mitchell id
                        .receiverId(hrUserId)
                        .message("Manager rejected \"" + course.getTitle() + "\"")
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .type("change_request")
                        .courseId(courseId)
                        .courseTitle(course.getTitle())
                        .build()
        );

        // Broadcast Real-time Event
        Map<String, Object> payload = new HashMap<>();
        payload.put("courseId", courseId);
        payload.put("courseName", course.getTitle());
        payload.put("status", "REJECTED");
        payload.put("action", "REJECTED");
        sseService.broadcast("course_review", payload);

        Map<String, String> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Change requests logged and notified to HR successfully.");
        return ResponseEntity.ok(res);
    }

    // Get Groups / Cohorts
    @GetMapping("/groups")
    public ResponseEntity<List<Group>> getGroups() {
        return ResponseEntity.ok(groupRepository.findAll());
    }

    // Create Group Cohort
    @PostMapping("/groups")
    public ResponseEntity<Group> createGroup(@RequestBody Group group) {
        if (group.getId() == null || group.getId().trim().isEmpty()) {
            group.setId("GRP-2026-" + (new Random().nextInt(9000) + 1000));
        }
        group.setCreatedDate(LocalDate.now());
        group.setManagerName("Sarah Mitchell");
        group.setStatus("Active");
        
        Group saved = groupRepository.save(group);
        return ResponseEntity.ok(saved);
    }

    // Warning / Nudge log endpoint
    public static class NudgeRequest {
        public Long employeeId;
        public Long courseId;
        public String message;
    }

    @PostMapping("/nudge")
    public ResponseEntity<Map<String, String>> nudgeEmployee(@RequestBody NudgeRequest req) {
        User emp = userRepository.findById(req.employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Course course = courseRepository.findById(req.courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        NudgeLog log = NudgeLog.builder()
                .managerId(3L) // Manager Sarah Mitchell id
                .employeeId(req.employeeId)
                .courseId(req.courseId)
                .employeeName(emp.getFullName())
                .courseName(course.getTitle())
                .message(req.message)
                .sentAt(LocalDateTime.now())
                .build();

        nudgeLogRepository.save(log);

        // Broadcast Event
        Map<String, Object> payload = new HashMap<>();
        payload.put("employeeId", req.employeeId);
        payload.put("employeeName", emp.getFullName());
        payload.put("courseId", req.courseId);
        payload.put("message", req.message);
        sseService.broadcast("employee_nudge", payload);

        Map<String, String> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Nudge warning alert successfully dispatched to " + emp.getFullName());
        return ResponseEntity.ok(res);
    }
    @GetMapping("/nudge/history")
    public ResponseEntity<List<NudgeLog>> getNudgeHistory() {
        return ResponseEntity.ok(nudgeLogRepository.findAllByOrderBySentAtDesc());
    }

    @GetMapping("/employees")
    public ResponseEntity<List<Map<String, Object>>> getEmployeesList() {
        List<User> employees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .collect(Collectors.toList());

        List<Map<String, Object>> list = new ArrayList<>();
        List<Course> activeCourses = courseRepository.findByActiveTrue();

        for (User emp : employees) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "EMP-" + emp.getId());
            map.put("name", emp.getFullName());
            map.put("email", emp.getEmail());
            map.put("department", emp.getDepartment() != null ? emp.getDepartment() : "Engineering");
            map.put("designation", emp.getDesignation() != null ? emp.getDesignation() : "Software Developer");
            map.put("joiningDate", "2026-03-01");
            map.put("linkedinUrl", emp.getLinkedinUrl());
            map.put("avatar", emp.getFullName() != null && !emp.getFullName().isEmpty() ? emp.getFullName().substring(0, 1) : "E");

            List<Course> empCourses = getAssignedCoursesForEmployee(emp, activeCourses);

            // Compute database-driven stats
            List<CourseProgress> progresses = courseProgressRepository.findByEmployeeId(emp.getId());
            long completed = 0;
            long inProgress = 0;
            long overdue = 0;
            
            java.time.LocalDate today = java.time.LocalDate.now();
            for (Course c : empCourses) {
                CourseProgress p = progresses.stream()
                        .filter(prog -> prog.getCourseId().equals(c.getId()))
                        .findFirst()
                        .orElse(null);
                
                if (p != null && p.isCompleted()) {
                    completed++;
                } else {
                    if (p != null && p.getProgressPercentage() > 0) {
                        inProgress++;
                    }
                    if (c.getDueDate() != null && c.getDueDate().isBefore(today)) {
                        overdue++;
                    }
                }
            }

            map.put("assignedCourses", empCourses.size());
            map.put("completedCourses", completed);
            map.put("inProgressCourses", inProgress);
            map.put("overdueCourses", overdue);
            
            long certsCount = certificateRepository.findByEmployeeId(emp.getId()).size();
            map.put("certificatesEarned", certsCount);

            double avgScore = progresses.stream()
                    .filter(p -> p.getLastScore() != null)
                    .mapToInt(CourseProgress::getLastScore)
                    .average()
                    .orElse(0.0);
            map.put("averageQuizScore", Math.round(avgScore));
            
            double hours = progresses.stream()
                    .mapToDouble(p -> {
                        Course course = activeCourses.stream().filter(c -> c.getId().equals(p.getCourseId())).findFirst().orElse(null);
                        int duration = course != null ? course.getDuration() : 6;
                        return (p.getProgressPercentage() / 100.0) * duration;
                    })
                    .sum();
            map.put("learningHours", Math.round(hours));

            String status = emp.getStatus() != null ? emp.getStatus() : "Compliant";
            if (overdue > 0) {
                status = "Non-Compliant";
            } else if (inProgress > 0) {
                status = "Compliant";
            }
            map.put("status", status);

            list.add(map);
        }

        return ResponseEntity.ok(list);
    }

    @GetMapping("/employees/{employeeId}/courses")
    public ResponseEntity<List<Map<String, Object>>> getEmployeeCourses(@PathVariable String employeeId) {
        Long empId;
        try {
            String cleanId = employeeId.replace("EMP-", "");
            empId = Long.parseLong(cleanId);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }

        User emp = userRepository.findById(empId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        List<Course> activeCourses = courseRepository.findByActiveTrue();
        List<Course> empCourses = getAssignedCoursesForEmployee(emp, activeCourses);
        List<Map<String, Object>> list = new ArrayList<>();

        for (Course course : empCourses) {
            CourseProgress progress = courseProgressRepository.findByEmployeeIdAndCourseId(empId, course.getId())
                    .orElse(null);

            Map<String, Object> map = new HashMap<>();
            map.put("courseId", String.valueOf(course.getId()));
            map.put("courseName", course.getTitle());
            map.put("completionPercent", progress != null ? progress.getProgressPercentage() : 0);
            
            String status = "Not Started";
            if (progress != null) {
                if (progress.isCompleted()) {
                    status = "Completed";
                } else if (progress.getProgressPercentage() > 0) {
                    status = "In Progress";
                }
            }
            if (!"Completed".equals(status) && course.getDueDate().isBefore(LocalDate.now())) {
                status = "Overdue";
            }
            
            map.put("status", status);
            map.put("dueDate", course.getDueDate().toString());
            list.add(map);
        }

        return ResponseEntity.ok(list);
    }
}
