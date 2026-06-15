package com.example.clms.course;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByActiveTrue();
    List<Course> findByTitleContainingIgnoreCase(String title);
    List<Course> findByActiveTrueAndTitleContainingIgnoreCase(String title);
    boolean existsByTitleIgnoreCase(String title);
    List<Course> findByTitleIgnoreCase(String title);
}
