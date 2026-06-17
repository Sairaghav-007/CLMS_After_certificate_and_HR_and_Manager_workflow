package com.example.clms.admin;

import com.example.clms.user.User;
import com.example.clms.user.Role;
import com.example.clms.user.UserRepository;
import com.example.clms.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/learning-paths")
public class LearningPathController {

    @Autowired
    private LearningPathRepository learningPathRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public List<LearningPath> getAllPaths() {
        return learningPathRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LearningPath> getPathById(@PathVariable String id) {
        Optional<LearningPath> path = learningPathRepository.findById(id);
        return path.map(ResponseEntity::ok)
                   .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public LearningPath createPath(@RequestBody LearningPath path) {
        if (path.getId() == null || path.getId().trim().isEmpty()) {
            path.setId("PATH-" + System.currentTimeMillis());
        }
        LearningPath saved = learningPathRepository.save(path);

        // Notify Employees
        try {
            List<User> employees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE && u.isActive())
                .filter(u -> saved.getDepartment() == null || saved.getDepartment().isBlank() 
                         || "All".equalsIgnoreCase(saved.getDepartment()) 
                         || saved.getDepartment().equalsIgnoreCase(u.getDepartment()))
                .toList();

            for (User emp : employees) {
                try {
                    notificationService.notifyEmployee(
                        emp,
                        "course_assigned",
                        "New Learning Path Assigned",
                        "You have been assigned the learning path \"" + saved.getName() + "\".",
                        null
                    );
                } catch (Exception e) {
                    System.err.println("[FCM] Failed to notify employee " + emp.getId() + " about learning path: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("[LearningPath] Notification dispatch failed: " + e.getMessage());
        }

        return saved;
    }

    @PutMapping("/{id}")
    public ResponseEntity<LearningPath> updatePath(@PathVariable String id, @RequestBody LearningPath pathDetails) {
        Optional<LearningPath> optionalPath = learningPathRepository.findById(id);
        if (optionalPath.isPresent()) {
            LearningPath path = optionalPath.get();
            path.setName(pathDetails.getName());
            path.setDescription(pathDetails.getDescription());
            path.setDuration(pathDetails.getDuration());
            path.setDepartment(pathDetails.getDepartment());
            LearningPath updatedPath = learningPathRepository.save(path);
            return ResponseEntity.ok(updatedPath);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePath(@PathVariable String id) {
        if (learningPathRepository.existsById(id)) {
            learningPathRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
