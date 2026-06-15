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

    @GetMapping("/{id}")
    public ResponseEntity<CourseDto> getCourseById(@PathVariable Long id) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        return courseOpt.map(course -> ResponseEntity.ok(new CourseDto(course)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
