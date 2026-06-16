package com.example.clms.dashboard;

import java.util.List;

public record EmployeeDashboardResponse(
        int completedCourses,
        int dueCourses,
        int inProgressCourses,
        int upcomingCourses,
        int certificatesEarned,
        List<String> chartLabels,
        List<Integer> chartValues
) {}