package com.example.clms.scorm;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScormRuntimeDataRepository extends JpaRepository<ScormRuntimeData, Long> {

    Optional<ScormRuntimeData> findByEmployeeIdAndSectionId(Long employeeId, Long sectionId);
}
