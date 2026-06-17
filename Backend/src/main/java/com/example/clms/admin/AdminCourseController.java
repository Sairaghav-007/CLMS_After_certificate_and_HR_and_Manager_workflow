package com.example.clms.admin;

import com.example.clms.course.Course;
import com.example.clms.course.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.example.clms.user.UserRepository;
import com.example.clms.user.User;
import com.example.clms.user.Role;
import com.example.clms.notification.NotificationService;

@RestController
@RequestMapping("/api/admin/courses")
public class AdminCourseController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    public static class CourseDto {
        public String id;
        public String title;
        public String description;
        public String category; // "Mandatory", "Departmental", "Elective"
        public String status;   // "DRAFT", "PENDING_REVIEW", "REJECTED", "PUBLISHED", "ARCHIVED"
        public String createdBy;
        public int duration; // in hours

        public CourseDto() {}

        public CourseDto(Course course) {
            this.id = String.valueOf(course.getId());
            this.title = course.getTitle();
            this.description = course.getDescription() != null ? course.getDescription() : "";
            this.duration = course.getDuration() > 0 ? course.getDuration() : 10;
            this.status = course.getStatus() != null ? course.getStatus() : "DRAFT";
            this.createdBy = course.getCreatedBy() != null ? course.getCreatedBy() : "HR";

            // Map DB category string to UI category
            if ("Department-Oriented".equalsIgnoreCase(course.getCategory()) || "Departmental".equalsIgnoreCase(course.getCategory())) {
                this.category = "Departmental";
            } else if ("Mandatory".equalsIgnoreCase(course.getCategory())) {
                this.category = "Mandatory";
            } else {
                this.category = "Elective";
            }
        }
    }

    @GetMapping
    public List<CourseDto> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(CourseDto::new)
                .collect(Collectors.toList());
    }

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @GetMapping("/{id}")
    public ResponseEntity<CourseDto> getCourseById(@PathVariable Long id) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        return courseOpt.map(course -> ResponseEntity.ok(new CourseDto(course)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isPresent()) {
            Course course = courseOpt.get();
            // delete entries from related tables using JPQL to prevent constraint violations
            // Keep completed progress records so the employee completed count doesn't change
            entityManager.createQuery("DELETE FROM CourseProgress cp WHERE cp.courseId = :id AND cp.completed = false").setParameter("id", id).executeUpdate();
            
            // Keep completed section progress records
            List<Long> completedEmpIds = entityManager.createQuery("SELECT cp.employeeId FROM CourseProgress cp WHERE cp.courseId = :id AND cp.completed = true", Long.class)
                .setParameter("id", id).getResultList();
            if (completedEmpIds.isEmpty()) {
                entityManager.createQuery("DELETE FROM CourseSectionProgress csp WHERE csp.courseId = :id").setParameter("id", id).executeUpdate();
            } else {
                entityManager.createQuery("DELETE FROM CourseSectionProgress csp WHERE csp.courseId = :id AND csp.employeeId NOT IN :empIds")
                    .setParameter("id", id).setParameter("empIds", completedEmpIds).executeUpdate();
            }

            // Do NOT delete certificates: Certificate table holds standalone courseId references
            entityManager.createQuery("DELETE FROM CourseEnrollment ce WHERE ce.courseId = :id").setParameter("id", id).executeUpdate();
            entityManager.createQuery("DELETE FROM ChangeRequest cr WHERE cr.courseId = :id").setParameter("id", id).executeUpdate();
            entityManager.createQuery("DELETE FROM Notification n WHERE n.courseId = :id").setParameter("id", id).executeUpdate();
            entityManager.createQuery("DELETE FROM AuditLog al WHERE al.courseId = :id").setParameter("id", id).executeUpdate();
            entityManager.createQuery("DELETE FROM Question q WHERE q.courseId = :id").setParameter("id", id).executeUpdate();
            entityManager.createQuery("DELETE FROM CourseContent cc WHERE cc.courseId = :id").setParameter("id", id).executeUpdate();
            
            courseRepository.deleteById(id);

            // Notify active employees
            try {
                List<User> employees = userRepository.findAll().stream()
                        .filter(u -> u.getRole() == Role.EMPLOYEE && u.isActive())
                        .collect(Collectors.toList());

                for (User emp : employees) {
                    try {
                        notificationService.notifyEmployee(
                            emp,
                            "course_removed",
                            "Course Removed",
                            "The course \"" + course.getTitle() + "\" has been deleted and removed by the Administrator.",
                            null
                        );
                    } catch (Exception e) {
                        System.err.println("[FCM] Failed to notify employee " + emp.getId() + " about removed course: " + e.getMessage());
                    }
                }
            } catch (Exception e) {
                System.err.println("[AdminCourse] Notification failed: " + e.getMessage());
            }

            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
