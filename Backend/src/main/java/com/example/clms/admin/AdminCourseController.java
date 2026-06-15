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

@RestController
@RequestMapping("/api/admin/courses")
public class AdminCourseController {

    @Autowired
    private CourseRepository courseRepository;

    public static class CourseDto {
        public String id;
        public String title;
        public String category; // "Mandatory", "Departmental", "Elective"
        public int duration; // in hours

        public CourseDto() {}

        public CourseDto(Course course) {
            this.id = String.valueOf(course.getId());
            this.title = course.getTitle();
            this.duration = 10; // default duration

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
        // delete entries from related tables using JPQL to prevent constraint violations
        entityManager.createQuery("DELETE FROM CourseProgress cp WHERE cp.courseId = :id").setParameter("id", id).executeUpdate();
        entityManager.createQuery("DELETE FROM CourseSectionProgress csp WHERE csp.courseId = :id").setParameter("id", id).executeUpdate();
        entityManager.createQuery("DELETE FROM Certificate c WHERE c.courseId = :id").setParameter("id", id).executeUpdate();
        entityManager.createQuery("DELETE FROM CourseEnrollment ce WHERE ce.courseId = :id").setParameter("id", id).executeUpdate();
        entityManager.createQuery("DELETE FROM ChangeRequest cr WHERE cr.courseId = :id").setParameter("id", id).executeUpdate();
        entityManager.createQuery("DELETE FROM Notification n WHERE n.courseId = :id").setParameter("id", id).executeUpdate();
        entityManager.createQuery("DELETE FROM AuditLog al WHERE al.courseId = :id").setParameter("id", id).executeUpdate();
        entityManager.createQuery("DELETE FROM Question q WHERE q.courseId = :id").setParameter("id", id).executeUpdate();
        entityManager.createQuery("DELETE FROM CourseContent cc WHERE cc.courseId = :id").setParameter("id", id).executeUpdate();
        
        courseRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
