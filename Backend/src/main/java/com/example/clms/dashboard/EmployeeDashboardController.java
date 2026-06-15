package com.example.clms.dashboard;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employee/dashboard")
public class EmployeeDashboardController {

    @GetMapping
    public EmployeeDashboardResponse getDashboard() {
        return new EmployeeDashboardResponse(
                8,
                3,
                4,
                5,
                List.of("Completed", "Due", "In Progress", "Upcoming"),
                List.of(8, 3, 4, 5)
        );
    }
}