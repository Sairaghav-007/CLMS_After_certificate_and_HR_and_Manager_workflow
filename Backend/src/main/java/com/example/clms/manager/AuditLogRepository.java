package com.example.clms.manager;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByCourseId(Long courseId);
    List<AuditLog> findAllByOrderByTimestampDesc();
}
