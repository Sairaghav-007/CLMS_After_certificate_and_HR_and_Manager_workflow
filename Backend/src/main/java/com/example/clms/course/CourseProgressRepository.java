package com.example.clms.course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CourseProgressRepository extends JpaRepository<CourseProgress, Long> {
    
    @Query(value = "SELECT * FROM course_progress WHERE employee_id = :employeeId AND course_id = :courseId ORDER BY id DESC LIMIT 1", nativeQuery = true)
    Optional<CourseProgress> findByEmployeeIdAndCourseId(@Param("employeeId") Long employeeId, @Param("courseId") Long courseId);
    
    List<CourseProgress> findByEmployeeId(Long employeeId);
}
