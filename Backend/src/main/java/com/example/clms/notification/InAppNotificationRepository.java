package com.example.clms.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InAppNotificationRepository extends JpaRepository<InAppNotification, Long> {
    List<InAppNotification> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    List<InAppNotification> findByEmployeeIdAndIsReadFalse(Long employeeId);
}
