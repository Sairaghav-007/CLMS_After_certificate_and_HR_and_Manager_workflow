# Firebase Admin SDK Service Account Key - SETUP REQUIRED

## ≡ƒöæ How to enable push notifications (FCM)

The backend uses **Firebase Admin SDK** to send push notifications.
This requires a **service account key** that you must download from Firebase Console.

### Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project ΓåÆ **Project Settings** (gear icon)
3. Click the **"Service accounts"** tab
4. Click **"Generate new private key"** ΓåÆ Confirm
5. Save the downloaded JSON file as:

   ```
   backend/src/main/resources/serviceAccountKey.json
   ```

6. Restart the Spring Boot backend (`mvn clean spring-boot:run`)

### Γ£à Verification

When initialized correctly, you'll see in Spring Boot logs:
```
[FCM] Firebase Admin SDK initialized successfully.
```

If the file is missing, you'll see:
```
[FCM] ΓÜá serviceAccountKey.json not found. Push notifications will be DISABLED.
```

### ≡ƒöÆ Security Note

The `serviceAccountKey.json` file is already in `.gitignore` ΓÇö never commit it to git.
