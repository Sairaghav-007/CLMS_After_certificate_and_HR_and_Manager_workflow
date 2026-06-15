package com.example.clms;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {

    public static void main(String[] args) {

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String password = "Welcome@123";

        String hash = encoder.encode(password);

        System.out.println("Password : " + password);
        System.out.println("Hash     : " + hash);
    }
}