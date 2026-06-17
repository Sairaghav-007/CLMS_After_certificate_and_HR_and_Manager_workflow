package com.example.clms.notification;

import com.example.clms.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final InAppNotificationRepository inAppNotificationRepository;
    private final FcmService fcmService;

    public InAppNotification notifyEmployee(User employee, String type, String title, String message, String courseId) {
        InAppNotification notification = InAppNotification.builder()
                .employeeId(employee.getId())
                .title(title)
                .message(message)
                .type(type)
                .courseId(courseId)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        InAppNotification saved = inAppNotificationRepository.save(notification);

        if (employee.getFcmToken() != null && !employee.getFcmToken().trim().isEmpty()) {
            Map<String, Object> data = new HashMap<>();
            data.put("type", type);
            data.put("notificationId", String.valueOf(saved.getId()));
            if (courseId != null) {
                data.put("courseId", courseId);
            }
            fcmService.sendPushNotification(employee.getFcmToken(), title, message, data);
        }

        return saved;
    }
}
