package com.clms.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "\"Role\"")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    @Id
    @Column(name = "\"R_Unique_ID\"")
    private String uniqueId;

    @Column(name = "\"R_Email\"", nullable = false)
    private String email;

    @Column(name = "\"R_Password\"", nullable = false)
    private String password;

    @Column(name = "\"R_Firts_name\"", nullable = false)
    private String firstName;

    @Column(name = "\"R_Middle_Name\"")
    private String middleName;

    @Column(name = "\"R_Last_Name\"")
    private String lastName;

    @Column(name = "\"R_Role\"", nullable = false)
    private String role;

    @Column(name = "\"R_Joining_Year\"", nullable = false)
    private int joiningYear;
}
