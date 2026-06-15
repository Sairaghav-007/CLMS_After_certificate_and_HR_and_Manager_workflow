package com.example.clms.dashboard;

import java.util.List;

public record EmployeeDashboardResponse(
        int completedCourses,
        int dueCourses,
        int inProgressCourses,
        int upcomingCourses,
        List<String> chartLabels,
        List<Integer> chartValues
) {}