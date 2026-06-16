package com.example.clms.course;

import java.time.LocalDate;
import java.util.List;

public record CourseDetailResponse(
        Long id,
        String title,
        String category,
        String description,
        LocalDate dueDate,
        int progress,
        String status,
        CertificateResponse certificate,
        AssessmentResponse assessment,
        List<ModuleResponse> modules
) {
    public record CertificateResponse(
            Long id,
            String certificateNumber,
            String qrCodeData,
            String verificationUrl,
            String issuedAt,
            String employeeName,
            String courseName
    ) {}

    public record AssessmentResponse(
            String id,
            String title,
            int timeLimit,
            int passingPercentage,
            int maxAttempts,
            int attemptsUsed,
            boolean isLocked,
            boolean isPassed,
            Integer lastScore,
            List<QuestionResponse> questions
    ) {}

    public record QuestionResponse(
            String id,
            String type,
            String text,
            List<OptionResponse> options,
            List<String> correctAnswers,
            int points
    ) {}

    public record OptionResponse(
            String id,
            String text
    ) {}

    public record ModuleResponse(
            Long id,
            String title,
            Integer moduleOrder,
            int completionPercentage,
            boolean isCompleted,
            boolean isLocked,
            List<SectionResponse> sections
    ) {}

    public record SectionResponse(
            Long id,
            String title,
            MaterialType materialType,
            String materialUrl,
            Integer sectionOrder,
            int progress,
            boolean isCompleted,
            Integer duration,
            Integer totalPages
    ) {}
}
