package com.example.clms.dashboard;

import com.example.clms.course.*;
import com.example.clms.user.User;
import com.example.clms.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/employee/dashboard")
@RequiredArgsConstructor
public class EmployeeDashboardController {

    private final CourseRepository courseRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged in user not found: " + email));
    }

    @GetMapping
    public EmployeeDashboardResponse getDashboard() {
        User employee = getAuthenticatedUser();
        Long empId = employee.getId();

        // Get all published/active courses matching department visibility rules
        List<Course> allCourses = courseRepository.findByActiveTrue().stream()
                .filter(course -> "PUBLISHED".equalsIgnoreCase(course.getStatus()) || "READY_TO_PUBLISH".equalsIgnoreCase(course.getStatus()))
                .filter(course -> {
                    if ("Department-Oriented".equalsIgnoreCase(course.getCategory())) {
                        String empDept = employee.getDepartment();
                        String courseDept = course.getDepartment();
                        return empDept != null && empDept.equalsIgnoreCase(courseDept);
                    }
                    return true;
                })
                .toList();

        // Get all progress records for this employee
        List<CourseProgress> allProgress = courseProgressRepository.findByEmployeeId(empId);

        int completedCourses = (int) allProgress.stream()
                .filter(CourseProgress::isCompleted)
                .count();
        int inProgressCourses = 0;
        int dueCourses = 0;
        int upcomingCourses = 0;

        LocalDate today = LocalDate.now();

        for (Course course : allCourses) {
            CourseProgress progress = allProgress.stream()
                    .filter(p -> p.getCourseId().equals(course.getId()))
                    .findFirst()
                    .orElse(null);

            if (progress == null || !progress.isCompleted()) {
                if (progress != null && progress.getProgressPercentage() > 0) {
                    inProgressCourses++;
                    // If due date is within 7 days, also count as due
                    if (course.getDueDate() != null && !course.getDueDate().isAfter(today.plusDays(7))) {
                        dueCourses++;
                    }
                } else {
                    // Not started
                    upcomingCourses++;
                }
            }
        }

        // Count certificates earned by this employee
        int certificatesEarned = certificateRepository.findByEmployeeId(empId).size();

        // Chart data: show status distribution
        List<String> chartLabels = List.of("Completed", "In Progress", "Due Soon", "Upcoming");
        List<Integer> chartValues = List.of(completedCourses, inProgressCourses, dueCourses, upcomingCourses);

        return new EmployeeDashboardResponse(
                completedCourses,
                dueCourses,
                inProgressCourses,
                upcomingCourses,
                certificatesEarned,
                chartLabels,
                chartValues
        );
    }
}