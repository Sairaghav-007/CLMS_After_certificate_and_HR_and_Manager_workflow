package com.example.clms.course;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CourseSectionProgressRepository extends JpaRepository<CourseSectionProgress, Long> {
    Optional<CourseSectionProgress> findByEmployeeIdAndCourseIdAndSectionId(Long employeeId, Long courseId, Long sectionId);
    List<CourseSectionProgress> findByEmployeeIdAndCourseId(Long employeeId, Long courseId);
    List<CourseSectionProgress> findByEmployeeId(Long employeeId);
}
