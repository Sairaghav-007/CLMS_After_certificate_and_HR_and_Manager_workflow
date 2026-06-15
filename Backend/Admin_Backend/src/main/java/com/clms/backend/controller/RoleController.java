package com.clms.backend.controller;

import com.clms.backend.model.Role;
import com.clms.backend.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleRepository roleRepository;

    @GetMapping
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Role> getRoleById(@PathVariable String id) {
        Optional<Role> role = roleRepository.findById(id);
        return role.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Role createRole(@RequestBody Role role) {
        if (role.getUniqueId() == null || role.getUniqueId().trim().isEmpty()) {
            role.setUniqueId("ROLE-" + System.currentTimeMillis());
        }
        return roleRepository.save(role);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Role> updateRole(@PathVariable String id, @RequestBody Role roleDetails) {
        Optional<Role> optionalRole = roleRepository.findById(id);
        if (optionalRole.isPresent()) {
            Role role = optionalRole.get();
            role.setEmail(roleDetails.getEmail());
            role.setPassword(roleDetails.getPassword());
            role.setFirstName(roleDetails.getFirstName());
            role.setMiddleName(roleDetails.getMiddleName());
            role.setLastName(roleDetails.getLastName());
            role.setRole(roleDetails.getRole());
            role.setJoiningYear(roleDetails.getJoiningYear());
            Role updatedRole = roleRepository.save(role);
            return ResponseEntity.ok(updatedRole);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable String id) {
        if (roleRepository.existsById(id)) {
            roleRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
