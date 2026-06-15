package com.example.clms.course;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CourseProgressRepository extends JpaRepository<CourseProgress, Long> {
    Optional<CourseProgress> findByEmployeeIdAndCourseId(Long employeeId, Long courseId);
    List<CourseProgress> findByEmployeeId(Long employeeId);
}
