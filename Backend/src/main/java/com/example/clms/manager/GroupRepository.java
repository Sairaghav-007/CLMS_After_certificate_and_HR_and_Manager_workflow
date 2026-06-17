package com.example.clms.manager;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface GroupRepository extends JpaRepository<Group, String> {
    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM group_courses WHERE group_id = ?1", nativeQuery = true)
    void deleteGroupCourses(String groupId);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM group_employees WHERE group_id = ?1", nativeQuery = true)
    void deleteGroupEmployees(String groupId);
}
