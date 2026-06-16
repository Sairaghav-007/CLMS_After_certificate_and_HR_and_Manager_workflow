package com.example.clms.course;

import java.time.LocalDate;

public record CourseSummaryResponse(
        Long id,
        String title,
        String category,
        String description,
        LocalDate dueDate,
        int progress,
        String status,
        String thumbnail
) {}
