package com.example.clms.notification;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.FileReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;

@Service
public class SesEmailService {

    private SesClient sesClient;
    private String senderEmail = "noreply@clms.com"; // default, overridden by .env
    private String emailApiUrl;

    @PostConstruct
    public void init() {
        try {
            Map<String, String> envVars = loadEnvFile("d:/clms-virtusa/.env");

            String region = envVars.getOrDefault("VITE_AWS_REGION", "ap-southeast-2");
            String accessKeyId = envVars.get("VITE_AWS_ACCESS_KEY_ID");
            String secretAccessKey = envVars.get("VITE_AWS_SECRET_ACCESS_KEY");

            if (envVars.containsKey("SES_SENDER_EMAIL")) {
                senderEmail = envVars.get("SES_SENDER_EMAIL");
            }

            if (envVars.containsKey("VITE_EMAIL_API_URL")) {
                emailApiUrl = envVars.get("VITE_EMAIL_API_URL");
            }

            if (accessKeyId == null || secretAccessKey == null) {
                System.err.println("[SES] AWS credentials not found in .env file. Direct AWS SDK email sending will be disabled.");
            } else {
                sesClient = SesClient.builder()
                        .region(Region.of(region))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKeyId, secretAccessKey)
                        ))
                        .build();
                System.out.println("[SES] SesEmailService initialized successfully with AWS SDK. Region: " + region + ", Sender: " + senderEmail);
            }

            if (emailApiUrl != null) {
                System.out.println("[SES] Lambda Email API detected: " + emailApiUrl);
            }
        } catch (Exception e) {
            System.err.println("[SES] Failed to initialize SesEmailService: " + e.getMessage());
        }
    }

    private Map<String, String> loadEnvFile(String path) {
        Map<String, String> vars = new HashMap<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int idx = line.indexOf('=');
                if (idx > 0) {
                    String key = line.substring(0, idx).trim();
                    String value = line.substring(idx + 1).trim();
                    vars.put(key, value);
                }
            }
        } catch (Exception e) {
            System.err.println("[SES] Could not read .env file: " + e.getMessage());
        }
        return vars;
    }

    public void sendEmail(String toAddress, String subject, String bodyHtml) {
        boolean sesSent = false;
        
        // 1. Attempt sending via AWS SES SDK if initialized
        if (sesClient != null) {
            try {
                SendEmailRequest request = SendEmailRequest.builder()
                        .source(senderEmail)
                        .destination(Destination.builder()
                                .toAddresses(toAddress)
                                .build())
                        .message(Message.builder()
                                .subject(Content.builder().data(subject).charset("UTF-8").build())
                                .body(Body.builder()
                                        .html(Content.builder().data(bodyHtml).charset("UTF-8").build())
                                        .build())
                                .build())
                        .build();

                sesClient.sendEmail(request);
                System.out.println("[SES] Email sent successfully via AWS SDK to: " + toAddress + " | Subject: " + subject);
                sesSent = true;
            } catch (SesException e) {
                System.err.println("[SES] Failed to send email via AWS SDK to " + toAddress + ": " + e.awsErrorDetails().errorMessage());
            } catch (Exception e) {
                System.err.println("[SES] Unexpected error sending email via AWS SDK to " + toAddress + ": " + e.getMessage());
            }
        }

        // 2. Fall back to Lambda API Function URL if direct AWS SDK failed or was not initialized
        if (!sesSent && emailApiUrl != null && !emailApiUrl.trim().isEmpty()) {
            System.out.println("[SES] Attempting email dispatch fallback to Lambda Email URL: " + emailApiUrl);
            try {
                // Safely escape subject and html body strings for JSON payload
                String escapedSubject = subject.replace("\\", "\\\\").replace("\"", "\\\"");
                String escapedBody = bodyHtml.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");

                // Use multiple variations of keys to ensure compatibility with any standard Lambda body parser schema
                String jsonPayload = "{"
                        + "\"to\":\"" + toAddress + "\","
                        + "\"email\":\"" + toAddress + "\","
                        + "\"subject\":\"" + escapedSubject + "\","
                        + "\"body\":\"" + escapedBody + "\","
                        + "\"html\":\"" + escapedBody + "\""
                        + "}";

                HttpClient client = HttpClient.newHttpClient();
                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(emailApiUrl))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .build();

                HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
                System.out.println("[SES] Lambda Email API Response Status: " + response.statusCode());
                System.out.println("[SES] Lambda Email API Response Body: " + response.body());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    System.out.println("[SES] Email sent successfully via Lambda fallback to: " + toAddress);
                } else {
                    System.err.println("[SES] Lambda Email API fallback failed with response code: " + response.statusCode());
                }
            } catch (Exception e) {
                System.err.println("[SES] Failed to send email via Lambda fallback: " + e.getMessage());
            }
        }
    }

    /**
     * Send a styled welcome email to a newly created user with their credentials.
     */
    public void sendWelcomeEmail(String toAddress, String fullName, String password) {
        String subject = "Welcome to CLMS ΓÇö Your Account Has Been Created";
        String html = "<!DOCTYPE html>"
                + "<html><head><meta charset='UTF-8'></head>"
                + "<body style='margin:0;padding:0;background:#f4f6fb;font-family:Segoe UI,Roboto,Arial,sans-serif;'>"
                + "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6fb;padding:40px 0;'>"
                + "<tr><td align='center'>"
                + "<table width='520' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;'>"
                // Header
                + "<tr><td style='background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;'>"
                + "<h1 style='margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;'>≡ƒÄô Welcome to CLMS</h1>"
                + "<p style='margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;'>Corporate Learning Management System</p>"
                + "</td></tr>"
                // Body
                + "<tr><td style='padding:32px 40px;'>"
                + "<p style='margin:0 0 16px;color:#1e293b;font-size:15px;'>Hi <strong>" + fullName + "</strong>,</p>"
                + "<p style='margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;'>Your account has been created by an administrator. Use the credentials below to log in:</p>"
                + "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;'>"
                + "<tr><td style='padding:16px 20px;border-bottom:1px solid #e2e8f0;'>"
                + "<span style='color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;'>Username / Email</span><br>"
                + "<span style='color:#0f172a;font-size:15px;font-weight:600;'>" + toAddress + "</span>"
                + "</td></tr>"
                + "<tr><td style='padding:16px 20px;'>"
                + "<span style='color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;'>Temporary Password</span><br>"
                + "<code style='background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:4px;font-size:14px;font-weight:600;'>" + password + "</code>"
                + "</td></tr></table>"
                + "<p style='margin:0 0 8px;color:#475569;font-size:13px;'>ΓÜá∩╕Å Please change your password after your first login.</p>"
                + "</td></tr>"
                // Footer
                + "<tr><td style='padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;'>"
                + "<p style='margin:0;color:#94a3b8;font-size:11px;text-align:center;'>This is an automated message from the CLMS platform. Do not reply to this email.</p>"
                + "</td></tr>"
                + "</table></td></tr></table></body></html>";

        sendEmail(toAddress, subject, html);
    }

    /**
     * Send a styled compliance warning email when a manager nudges an employee.
     */
    public void sendNudgeWarningEmail(String toAddress, String employeeName, String managerName,
                                       String courseName, String warningMessage) {
        String subject = "ΓÜá∩╕Å Compliance Warning ΓÇö Action Required for \"" + courseName + "\"";
        String html = "<!DOCTYPE html>"
                + "<html><head><meta charset='UTF-8'></head>"
                + "<body style='margin:0;padding:0;background:#f4f6fb;font-family:Segoe UI,Roboto,Arial,sans-serif;'>"
                + "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6fb;padding:40px 0;'>"
                + "<tr><td align='center'>"
                + "<table width='520' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;'>"
                // Header
                + "<tr><td style='background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px 40px;'>"
                + "<h1 style='margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;'>ΓÜá∩╕Å Compliance Warning</h1>"
                + "<p style='margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;'>Manager Escalation Alert</p>"
                + "</td></tr>"
                // Body
                + "<tr><td style='padding:32px 40px;'>"
                + "<p style='margin:0 0 16px;color:#1e293b;font-size:15px;'>Hi <strong>" + employeeName + "</strong>,</p>"
                + "<p style='margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;'>Your manager <strong>" + managerName + "</strong> has flagged you regarding the course below:</p>"
                // Course card
                + "<table width='100%' cellpadding='0' cellspacing='0' style='background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin-bottom:20px;'>"
                + "<tr><td style='padding:16px 20px;'>"
                + "<span style='color:#991b1b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;'>Course</span><br>"
                + "<span style='color:#0f172a;font-size:15px;font-weight:600;'>" + courseName + "</span>"
                + "</td></tr></table>"
                // Message card
                + "<table width='100%' cellpadding='0' cellspacing='0' style='background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:24px;'>"
                + "<tr><td style='padding:16px 20px;'>"
                + "<span style='color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;'>Manager's Message</span><br>"
                + "<p style='margin:8px 0 0;color:#78350f;font-size:14px;line-height:1.5;font-style:italic;'>\"" + warningMessage + "\"</p>"
                + "</td></tr></table>"
                + "<p style='margin:0 0 8px;color:#dc2626;font-size:13px;font-weight:600;'>Please complete the required course material as soon as possible to avoid further escalation.</p>"
                + "</td></tr>"
                // Footer
                + "<tr><td style='padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;'>"
                + "<p style='margin:0;color:#94a3b8;font-size:11px;text-align:center;'>This is an automated message from the CLMS platform. Do not reply to this email.</p>"
                + "</td></tr>"
                + "</table></td></tr></table></body></html>";

        sendEmail(toAddress, subject, html);
    }
}
