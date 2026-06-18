package com.example.clms.course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    
    @Query(value = "SELECT * FROM certificates WHERE employee_id = :employeeId AND course_id = :courseId ORDER BY id DESC LIMIT 1", nativeQuery = true)
    Optional<Certificate> findByEmployeeIdAndCourseId(@Param("employeeId") Long employeeId, @Param("courseId") Long courseId);
    
    List<Certificate> findByEmployeeId(Long employeeId);
}
