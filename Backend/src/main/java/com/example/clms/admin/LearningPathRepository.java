package com.example.clms.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, String> {
}
