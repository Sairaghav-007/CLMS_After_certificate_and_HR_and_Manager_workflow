package com.example.clms.manager;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "learning_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Group {

    @Id
    private String id; // e.g. GRP-2026-1001

    private String name;
    
    @Column(length = 2048)
    private String description;
    
    private String department;
    private String managerName;
    private LocalDate createdDate;
    private String status; // "Active", "Archived"

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "group_courses", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "course_name")
    private List<String> courses; // Course names

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "group_employees", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "employee_id")
    private List<String> employees; // Employee IDs
}
