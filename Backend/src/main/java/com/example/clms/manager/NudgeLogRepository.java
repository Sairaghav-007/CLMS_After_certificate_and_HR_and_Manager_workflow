package com.example.clms.manager;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NudgeLogRepository extends JpaRepository<NudgeLog, Long> {
    List<NudgeLog> findAllByOrderBySentAtDesc();
}
