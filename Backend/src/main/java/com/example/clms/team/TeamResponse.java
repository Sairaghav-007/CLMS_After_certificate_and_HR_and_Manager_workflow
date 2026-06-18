package com.example.clms.team;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamResponse {
    private String teamId;
    private String name;
    private List<EmployeeDto> employees;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployeeDto {
        private String uniqueId;
        private String email;
        private String fullName;
        private String department;
        private String designation;
    }
}
