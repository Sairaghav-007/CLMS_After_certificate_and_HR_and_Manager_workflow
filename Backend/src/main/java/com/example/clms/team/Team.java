package com.example.clms.team;

import com.example.clms.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.util.Set;

@Entity
@Table(name = "teams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @Column(name = "team_id", unique = true, nullable = false)
    private String teamId;

    @Column(nullable = false)
    private String name;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "team_members",
        joinColumns = @JoinColumn(name = "team_id", referencedColumnName = "team_id"),
        inverseJoinColumns = @JoinColumn(name = "employee_id", referencedColumnName = "id")
    )
    private Set<User> employees;
}
