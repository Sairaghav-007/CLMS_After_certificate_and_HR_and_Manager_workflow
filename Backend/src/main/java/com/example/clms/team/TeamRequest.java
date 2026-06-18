package com.example.clms.team;

import lombok.*;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamRequest {
    private String teamId;
    private String name;
    private Set<String> employeeIds;
}
