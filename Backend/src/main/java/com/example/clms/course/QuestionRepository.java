package com.example.clms.course;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByCourseId(Long courseId);
    List<Question> findByCourseIdAndSectionId(Long courseId, Long sectionId);
    void deleteByCourseId(Long courseId);
}
