package com.example.clms.team;

import com.example.clms.user.User;
import com.example.clms.user.Role;
import com.example.clms.user.UserRepository;
import com.example.clms.course.Course;
import com.example.clms.course.CourseRepository;
import com.example.clms.course.CourseProgress;
import com.example.clms.course.CourseProgressRepository;
import com.example.clms.course.CertificateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TeamController {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseProgressRepository courseProgressRepository;

    @Autowired
    private CertificateRepository certificateRepository;

    private List<Course> getAssignedCoursesForEmployee(User emp, List<Course> activeCourses) {
        return activeCourses.stream()
                .filter(c -> "PUBLISHED".equalsIgnoreCase(c.getStatus()) || "READY_TO_PUBLISH".equalsIgnoreCase(c.getStatus()))
                .filter(c -> {
                    if ("Department-Oriented".equalsIgnoreCase(c.getCategory())) {
                        String empDept = emp.getDepartment();
                        String courseDept = c.getDepartment();
                        return empDept != null && empDept.equalsIgnoreCase(courseDept);
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    private TeamResponse mapToTeamResponse(Team team) {
        List<TeamResponse.EmployeeDto> employees = team.getEmployees().stream()
                .map(emp -> TeamResponse.EmployeeDto.builder()
                        .uniqueId(String.valueOf(emp.getId()))
                        .email(emp.getEmail())
                        .fullName(emp.getFullName())
                        .department(emp.getDepartment())
                        .designation(emp.getDesignation())
                        .build())
                .collect(Collectors.toList());

        return TeamResponse.builder()
                .teamId(team.getTeamId())
                .name(team.getName())
                .employees(employees)
                .build();
    }

    // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────

    @GetMapping("/admin/teams")
    public ResponseEntity<List<TeamResponse>> getAllTeamsAdmin() {
        List<TeamResponse> list = teamRepository.findAll().stream()
                .map(this::mapToTeamResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/admin/teams")
    public ResponseEntity<?> createTeamAdmin(@RequestBody TeamRequest req) {
        if (req.getTeamId() == null || req.getTeamId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Team ID is required");
        }
        if (teamRepository.existsByTeamId(req.getTeamId())) {
            return ResponseEntity.badRequest().body("Team ID must be unique");
        }
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Team Name is required");
        }

        Set<User> employees = new HashSet<>();
        if (req.getEmployeeIds() != null) {
            for (String empIdStr : req.getEmployeeIds()) {
                try {
                    Long id = Long.parseLong(empIdStr.replace("EMP-", "").trim());
                    userRepository.findById(id).ifPresent(employees::add);
                } catch (NumberFormatException e) {
                    // ignore invalid IDs
                }
            }
        }

        Team team = Team.builder()
                .teamId(req.getTeamId().trim())
                .name(req.getName().trim())
                .employees(employees)
                .build();

        Team saved = teamRepository.save(team);
        return ResponseEntity.ok(mapToTeamResponse(saved));
    }

    @PutMapping("/admin/teams/{teamId}")
    public ResponseEntity<?> updateTeamAdmin(@PathVariable String teamId, @RequestBody TeamRequest req) {
        Optional<Team> teamOpt = teamRepository.findById(teamId);
        if (teamOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Team team = teamOpt.get();
        if (req.getName() != null && !req.getName().trim().isEmpty()) {
            team.setName(req.getName().trim());
        }

        Set<User> employees = new HashSet<>();
        if (req.getEmployeeIds() != null) {
            for (String empIdStr : req.getEmployeeIds()) {
                try {
                    Long id = Long.parseLong(empIdStr.replace("EMP-", "").trim());
                    userRepository.findById(id).ifPresent(employees::add);
                } catch (NumberFormatException e) {
                    // ignore invalid IDs
                }
            }
        }
        team.setEmployees(employees);

        Team saved = teamRepository.save(team);
        return ResponseEntity.ok(mapToTeamResponse(saved));
    }

    @DeleteMapping("/admin/teams/{teamId}")
    public ResponseEntity<?> deleteTeamAdmin(@PathVariable String teamId) {
        if (!teamRepository.existsById(teamId)) {
            return ResponseEntity.notFound().build();
        }
        teamRepository.deleteById(teamId);
        return ResponseEntity.ok().build();
    }

    // ─── MANAGER ENDPOINTS ──────────────────────────────────────────────

    @GetMapping("/manager/teams")
    public ResponseEntity<List<TeamResponse>> getAllTeamsManager() {
        List<TeamResponse> list = teamRepository.findAll().stream()
                .map(this::mapToTeamResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/manager/teams/completion")
    public ResponseEntity<?> getTeamCompletionManager(@RequestParam(value = "timeframe", defaultValue = "Monthly") String timeframe) {
        List<Team> teams = teamRepository.findAll();
        List<Course> activeCourses = courseRepository.findByActiveTrue();
        List<CourseProgress> allProgress = courseProgressRepository.findAll();

        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        if ("Weekly".equalsIgnoreCase(timeframe)) {
            cutoff = LocalDateTime.now().minusDays(7);
        } else if ("Quarterly".equalsIgnoreCase(timeframe)) {
            cutoff = LocalDateTime.now().minusDays(90);
        }

        List<Map<String, Object>> teamDetailsList = new ArrayList<>();

        double globalTotalCompletionScore = 0.0;
        double globalTotalLearningHours = 0.0;
        double globalTotalQuizScore = 0.0;
        int globalQuizCount = 0;
        Set<Long> globalNonCompliantEmployeeIds = new HashSet<>();
        int totalEmployeesInTeams = 0;

        for (Team team : teams) {
            Set<User> teamEmployees = team.getEmployees();
            double teamCompletionSum = 0.0;
            double teamLearningHoursSum = 0.0;
            double teamQuizScoreSum = 0.0;
            int teamQuizCount = 0;
            int teamNonCompliantCount = 0;

            for (User emp : teamEmployees) {
                List<Course> empCourses = getAssignedCoursesForEmployee(emp, activeCourses);
                double empCompletionSum = 0.0;

                for (Course course : empCourses) {
                    final LocalDateTime finalCutoff = cutoff;
                    CourseProgress progress = allProgress.stream()
                            .filter(p -> p.getEmployeeId().equals(emp.getId()) && p.getCourseId().equals(course.getId()))
                            .findFirst()
                            .orElse(null);

                    if (progress != null && progress.getLastAccessed() != null && progress.getLastAccessed().isAfter(finalCutoff)) {
                        empCompletionSum += progress.getProgressPercentage();
                        double courseHours = (progress.getProgressPercentage() / 100.0) * course.getDuration();
                        teamLearningHoursSum += courseHours;
                        globalTotalLearningHours += courseHours;

                        if (progress.getLastScore() != null) {
                            teamQuizScoreSum += progress.getLastScore();
                            teamQuizCount++;
                            globalTotalQuizScore += progress.getLastScore();
                            globalQuizCount++;
                        }
                    } else {
                        // no progress in this timeframe, counts as 0%
                        empCompletionSum += 0.0;
                    }
                }

                double empAvgCompletion = empCourses.isEmpty() ? 0.0 : (empCompletionSum / empCourses.size());
                teamCompletionSum += empAvgCompletion;

                // compliance is absolute (not timeframe bound)
                boolean isOverdue = false;
                for (Course course : empCourses) {
                    CourseProgress progress = allProgress.stream()
                            .filter(p -> p.getEmployeeId().equals(emp.getId()) && p.getCourseId().equals(course.getId()))
                            .findFirst()
                            .orElse(null);

                    if (progress == null || !progress.isCompleted()) {
                        if (course.getDueDate() != null && course.getDueDate().isBefore(LocalDate.now())) {
                            isOverdue = true;
                            break;
                        }
                    }
                }

                if (isOverdue) {
                    teamNonCompliantCount++;
                    globalNonCompliantEmployeeIds.add(emp.getId());
                }
            }

            double teamAverageCompletion = teamEmployees.isEmpty() ? 0.0 : (teamCompletionSum / teamEmployees.size());
            globalTotalCompletionScore += teamAverageCompletion;
            totalEmployeesInTeams += teamEmployees.size();

            String status = "Not Started";
            if (teamAverageCompletion == 100.0) {
                status = "Completed";
            } else if (teamAverageCompletion > 0.0) {
                status = "In Progress";
            }

            Map<String, Object> teamDetails = new HashMap<>();
            teamDetails.put("teamId", team.getTeamId());
            teamDetails.put("name", team.getName());
            teamDetails.put("averageCompletion", Math.round(teamAverageCompletion * 10.0) / 10.0);
            teamDetails.put("status", status);
            teamDetails.put("learningHours", Math.round(teamLearningHoursSum * 10.0) / 10.0);
            teamDetails.put("averageQuizScore", teamQuizCount > 0 ? Math.round(teamQuizScoreSum / teamQuizCount) : 0);
            teamDetails.put("nonCompliantCount", teamNonCompliantCount);
            teamDetails.put("memberCount", teamEmployees.size());

            teamDetailsList.add(teamDetails);
        }

        // Global dashboard metrics calculations
        double avgCompletionRate = teams.isEmpty() ? 0.0 : (globalTotalCompletionScore / teams.size());
        double avgQuizScore = globalQuizCount > 0 ? (globalTotalQuizScore / globalQuizCount) : 0.0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("completionRate", Math.round(avgCompletionRate));
        metrics.put("totalHours", Math.round(globalTotalLearningHours));
        metrics.put("avgScore", Math.round(avgQuizScore));
        metrics.put("overdue", globalNonCompliantEmployeeIds.size());

        Map<String, Object> response = new HashMap<>();
        response.put("teams", teamDetailsList);
        response.put("metrics", metrics);

        return ResponseEntity.ok(response);
    }
}
