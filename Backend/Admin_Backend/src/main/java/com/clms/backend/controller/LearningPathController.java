package com.clms.backend.controller;

import com.clms.backend.model.LearningPath;
import com.clms.backend.repository.LearningPathRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/learning-paths")
public class LearningPathController {

    @Autowired
    private LearningPathRepository learningPathRepository;

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
        return learningPathRepository.save(path);
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
