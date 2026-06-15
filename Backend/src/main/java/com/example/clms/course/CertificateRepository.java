package com.example.clms.course;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findByEmployeeIdAndCourseId(Long employeeId, Long courseId);
    List<Certificate> findByEmployeeId(Long employeeId);
}
