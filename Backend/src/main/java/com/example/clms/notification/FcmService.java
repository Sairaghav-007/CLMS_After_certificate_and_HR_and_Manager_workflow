package com.example.clms.notification;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.InputStream;
import java.util.Map;

@Service
public class FcmService {

    private boolean initialized = false;

    public FcmService() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = loadServiceAccount();
                if (serviceAccount != null) {
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                            .build();
                    FirebaseApp.initializeApp(options);
                    initialized = true;
                    System.out.println("[FCM] Firebase Admin SDK initialized successfully.");
                } else {
                    System.err.println("[FCM] serviceAccountKey.json not found. Push notifications will be DISABLED.");
                }
            } else {
                initialized = true;
            }
        } catch (Exception e) {
            System.err.println("[FCM] Failed to initialize Firebase Admin SDK: " + e.getMessage());
        }
    }

    private InputStream loadServiceAccount() {
        InputStream stream = getClass().getClassLoader().getResourceAsStream("serviceAccountKey.json");
        if (stream != null) return stream;

        String[] paths = {
            "src/main/resources/serviceAccountKey.json",
            "../serviceAccountKey.json",
            "../FrontEnd/serviceAccountKey.json",
            "../Backend/src/main/resources/serviceAccountKey.json",
            "serviceAccountKey.json"
        };
        for (String path : paths) {
            try {
                return new FileInputStream(path);
            } catch (Exception ignored) {}
        }

        String envPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
        if (envPath != null && !envPath.isEmpty()) {
            try {
                return new FileInputStream(envPath);
            } catch (Exception e) {
                System.err.println("[FCM] Could not load GOOGLE_APPLICATION_CREDENTIALS: " + e.getMessage());
            }
        }
        return null;
    }

    public void sendPushNotification(String fcmToken, String title, String body, Map<String, Object> data) {
        if (fcmToken == null || fcmToken.trim().isEmpty()) return;
        if (!initialized) return;

        try {
            Message.Builder messageBuilder = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build());

            if (data != null) {
                for (Map.Entry<String, Object> entry : data.entrySet()) {
                    if (entry.getValue() != null) {
                        messageBuilder.putData(entry.getKey(), String.valueOf(entry.getValue()));
                    }
                }
            }

            FirebaseMessaging.getInstance().send(messageBuilder.build());
        } catch (FirebaseMessagingException e) {
            System.err.println("[FCM] Failed to send push: " + e.getMessagingErrorCode() + " ΓÇö " + e.getMessage());
        } catch (Exception e) {
            System.err.println("[FCM] Unexpected error: " + e.getMessage());
        }
    }
}
