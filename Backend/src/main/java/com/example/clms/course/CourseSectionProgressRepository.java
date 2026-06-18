package com.example.clms.course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CourseSectionProgressRepository extends JpaRepository<CourseSectionProgress, Long> {
    
    @Query(value = "SELECT * FROM course_section_progress WHERE employee_id = :employeeId AND course_id = :courseId AND section_id = :sectionId ORDER BY id DESC LIMIT 1", nativeQuery = true)
    Optional<CourseSectionProgress> findByEmployeeIdAndCourseIdAndSectionId(@Param("employeeId") Long employeeId, @Param("courseId") Long courseId, @Param("sectionId") Long sectionId);
    
    List<CourseSectionProgress> findByEmployeeIdAndCourseId(Long employeeId, Long courseId);
    List<CourseSectionProgress> findByEmployeeId(Long employeeId);
}
