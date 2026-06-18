package com.example.clms.scorm;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScormPackageRepository extends JpaRepository<ScormPackage, Long> {

    Optional<ScormPackage> findBySectionId(Long sectionId);

    List<ScormPackage> findByCourseId(Long courseId);

    Optional<ScormPackage> findByPackageUuid(String packageUuid);
}
