package com.example.clms.scorm;

import com.example.clms.user.User;
import com.example.clms.user.UserRepository;
import com.example.clms.course.Course;
import com.example.clms.course.CourseRepository;
import com.example.clms.course.CourseSection;
import com.example.clms.course.CourseSectionProgress;
import com.example.clms.course.CourseSectionProgressRepository;
import com.example.clms.course.CourseProgress;
import com.example.clms.course.CourseProgressRepository;
import com.example.clms.course.CourseModule;

import lombok.RequiredArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.BufferedReader;
import java.io.FileReader;
import java.time.LocalDateTime;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
// Import removed to avoid clash with Spring's @RequestBody
import software.amazon.awssdk.core.ResponseBytes;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ScormController {

    private final ScormPackageRepository scormPackageRepository;
    private final ScormRuntimeDataRepository scormRuntimeDataRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseSectionProgressRepository courseSectionProgressRepository;
    private final CourseProgressRepository courseProgressRepository;

    private S3Client s3Client;
    private String bucketName;
    private String cloudfrontDomain;

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            String[] paths = {
                "../FrontEnd/.env",
                "../.env",
                ".env",
                "src/main/resources/.env"
            };
            Map<String, String> envVars = new java.util.HashMap<>();
            for (String path : paths) {
                Map<String, String> loaded = loadEnvFile(path);
                if (!loaded.isEmpty()) {
                    envVars = loaded;
                    break;
                }
            }

            String region = envVars.getOrDefault("VITE_AWS_REGION", "ap-southeast-2");
            String accessKeyId = envVars.get("VITE_AWS_ACCESS_KEY_ID");
            String secretAccessKey = envVars.get("VITE_AWS_SECRET_ACCESS_KEY");
            this.bucketName = envVars.get("VITE_AWS_S3_BUCKET_NAME");
            this.cloudfrontDomain = envVars.get("VITE_CLOUDFRONT_URL");

            if (accessKeyId != null && secretAccessKey != null && bucketName != null) {
                this.s3Client = S3Client.builder()
                        .region(Region.of(region))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKeyId, secretAccessKey)
                        ))
                        .build();
                System.out.println("[SCORM S3] S3Client initialized successfully. Bucket: " + bucketName);
            } else {
                System.err.println("[SCORM S3] S3 credentials or bucket name not found in env. SCORM S3 upload disabled.");
            }
        } catch (Exception e) {
            System.err.println("[SCORM S3] Failed to initialize S3 client: " + e.getMessage());
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
            // ignore
        }
        return vars;
    }

    private void uploadFolderToS3(File folder, String s3Prefix) throws IOException {
        java.nio.file.Path folderPath = folder.toPath();
        try (java.util.stream.Stream<java.nio.file.Path> walk = java.nio.file.Files.walk(folderPath)) {
            walk.filter(java.nio.file.Files::isRegularFile).forEach(path -> {
                String relativeKey = folderPath.relativize(path).toString().replace('\\', '/');
                String s3Key = s3Prefix + "/" + relativeKey;
                try {
                    String contentType = determineContentType(path.getFileName().toString());
                    byte[] bytes = java.nio.file.Files.readAllBytes(path);
                    
                    PutObjectRequest putOb = PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(s3Key)
                            .contentType(contentType)
                            .build();
                            
                    s3Client.putObject(putOb, software.amazon.awssdk.core.sync.RequestBody.fromBytes(bytes));
                } catch (Exception e) {
                    throw new RuntimeException("S3 Upload failed for " + path + ": " + e.getMessage(), e);
                }
            });
        }
    }

    private String determineContentType(String fileName) {
        int dotIdx = fileName.lastIndexOf(".");
        if (dotIdx == -1) return "application/octet-stream";
        String ext = fileName.substring(dotIdx + 1).toLowerCase();
        switch (ext) {
            case "html": case "htm": return "text/html";
            case "js": return "application/javascript";
            case "css": return "text/css";
            case "xml": return "text/xml";
            case "json": return "application/json";
            case "png": return "image/png";
            case "jpg": case "jpeg": return "image/jpeg";
            case "gif": return "image/gif";
            case "svg": return "image/svg+xml";
            case "mp3": return "audio/mpeg";
            case "mp4": return "video/mp4";
            case "wav": return "audio/wav";
            case "woff": return "font/woff";
            case "woff2": return "font/woff2";
            case "ttf": return "font/ttf";
            case "otf": return "font/otf";
            case "eot": return "application/vnd.ms-fontobject";
            case "pdf": return "application/pdf";
            case "zip": return "application/zip";
            default: return "application/octet-stream";
        }
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @PostMapping("/api/hr/upload/scorm")
    public ResponseEntity<Map<String, Object>> uploadScorm(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Uploaded SCORM zip file is empty");
        }

        String packageUuid = UUID.randomUUID().toString();
        String rootDir = "temp-scorm";
        File destDir = new File(rootDir + File.separator + packageUuid);

        if (!destDir.exists()) {
            destDir.mkdirs();
        }

        try {
            unzip(file, destDir);
        } catch (IOException e) {
            deleteDir(destDir);
            throw new RuntimeException("Failed to extract SCORM package ZIP: " + e.getMessage(), e);
        }

        File manifestFile = new File(destDir, "imsmanifest.xml");
        if (!manifestFile.exists()) {
            deleteDir(destDir);
            throw new RuntimeException("SCORM imsmanifest.xml was not found in the root of the ZIP file.");
        }

        ScormManifestInfo manifestInfo = parseManifest(manifestFile);

        if (s3Client != null) {
            try {
                uploadFolderToS3(destDir, "scorm-packages/" + packageUuid);
            } catch (Exception e) {
                deleteDir(destDir);
                throw new RuntimeException("Failed to upload SCORM files to S3: " + e.getMessage(), e);
            }
        } else {
            deleteDir(destDir);
            throw new RuntimeException("S3Client is not initialized. SCORM upload requires AWS configuration.");
        }

        deleteDir(destDir);

        ScormPackage scormPackage = ScormPackage.builder()
                .packageUuid(packageUuid)
                .version(manifestInfo.version)
                .entryPath(manifestInfo.entryPoint)
                .extractedDir("s3://" + bucketName + "/scorm-packages/" + packageUuid)
                .uploadedAt(LocalDateTime.now())
                .build();

        scormPackage = scormPackageRepository.save(scormPackage);

        Map<String, Object> response = new HashMap<>();
        response.put("id", scormPackage.getId());
        response.put("packageUuid", scormPackage.getPackageUuid());
        response.put("entryPath", scormPackage.getEntryPath());
        response.put("version", scormPackage.getVersion());
        response.put("scormUrl", "/scorm-serve/" + packageUuid + "/" + manifestInfo.entryPoint);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/employee/scorm/{sectionId}/runtime")
    public ResponseEntity<Map<String, Object>> getRuntimeData(@PathVariable("sectionId") Long sectionId) {
        User employee = getAuthenticatedUser();
        Optional<ScormRuntimeData> opt = scormRuntimeDataRepository.findByEmployeeIdAndSectionId(employee.getId(), sectionId);

        Map<String, Object> response = new HashMap<>();
        if (opt.isPresent()) {
            ScormRuntimeData data = opt.get();
            response.put("lessonStatus", data.getLessonStatus());
            response.put("scoreRaw", data.getScoreRaw());
            response.put("suspendData", data.getSuspendData());
            response.put("location", data.getLessonLocation());
        } else {
            response.put("lessonStatus", "not attempted");
            response.put("scoreRaw", 0);
            response.put("suspendData", "");
            response.put("location", "");
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/employee/scorm/{sectionId}/runtime")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateRuntimeData(
            @PathVariable("sectionId") Long sectionId,
            @RequestBody ScormRuntimeDataUpdateRequest req
    ) {
        User employee = getAuthenticatedUser();

        // 1. Find the ScormPackage metadata to lookup the courseId
        ScormPackage pkg = scormPackageRepository.findBySectionId(sectionId)
                .orElseThrow(() -> new RuntimeException("Scorm package metadata not found for section: " + sectionId));

        Long courseId = pkg.getCourseId();
        if (courseId == null) {
            throw new RuntimeException("Scorm package is not associated with a course yet.");
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        // 2. Fetch or create the runtime data
        ScormRuntimeData data = scormRuntimeDataRepository.findByEmployeeIdAndSectionId(employee.getId(), sectionId)
                .orElse(null);

        if (data == null) {
            data = ScormRuntimeData.builder()
                    .employeeId(employee.getId())
                    .sectionId(sectionId)
                    .courseId(courseId)
                    .lessonStatus(req.getLessonStatus() != null ? req.getLessonStatus() : "not attempted")
                    .scoreRaw(req.getScoreRaw() != null ? req.getScoreRaw() : 0)
                    .suspendData(req.getSuspendData() != null ? req.getSuspendData() : "")
                    .lessonLocation(req.getLocation() != null ? req.getLocation() : "")
                    .updatedAt(LocalDateTime.now())
                    .build();
        } else {
            if (req.getLessonStatus() != null) {
                data.setLessonStatus(req.getLessonStatus());
            }
            if (req.getScoreRaw() != null) {
                data.setScoreRaw(req.getScoreRaw());
            }
            if (req.getSuspendData() != null) {
                data.setSuspendData(req.getSuspendData());
            }
            if (req.getLocation() != null) {
                data.setLessonLocation(req.getLocation());
            }
            data.setUpdatedAt(LocalDateTime.now());
        }

        data = scormRuntimeDataRepository.save(data);

        // 3. If lesson_status is passed or completed, synchronize with course_section_progress table
        boolean isComplete = "passed".equalsIgnoreCase(data.getLessonStatus()) || "completed".equalsIgnoreCase(data.getLessonStatus());
        if (isComplete) {
            CourseSectionProgress secProg = courseSectionProgressRepository
                    .findByEmployeeIdAndCourseIdAndSectionId(employee.getId(), courseId, sectionId)
                    .orElse(null);

            if (secProg == null) {
                secProg = CourseSectionProgress.builder()
                        .employeeId(employee.getId())
                        .courseId(courseId)
                        .sectionId(sectionId)
                        .progress(100)
                        .completed(true)
                        .lastAccessed(LocalDateTime.now())
                        .build();
            } else {
                secProg.setProgress(100);
                secProg.setCompleted(true);
                secProg.setLastAccessed(LocalDateTime.now());
            }
            courseSectionProgressRepository.save(secProg);

            // 4. Update overall course progress
            int totalSections = 0;
            int completedSections = 0;

            List<CourseSectionProgress> allSecProgress = courseSectionProgressRepository
                    .findByEmployeeIdAndCourseId(employee.getId(), courseId);

            for (CourseModule m : course.getModules()) {
                for (CourseSection s : m.getSections()) {
                    totalSections++;
                    boolean isCompleted = allSecProgress.stream()
                            .anyMatch(sp -> sp.getSectionId().equals(s.getId()) && sp.isCompleted());
                    if (isCompleted) {
                        completedSections++;
                    }
                }
            }

            int overallProgressPercent = totalSections == 0 ? 100 : (completedSections * 100) / totalSections;

            CourseProgress courseProgress = courseProgressRepository.findByEmployeeIdAndCourseId(employee.getId(), courseId)
                    .orElse(null);

            if (courseProgress == null) {
                courseProgress = CourseProgress.builder()
                        .employeeId(employee.getId())
                        .courseId(courseId)
                        .progressPercentage(overallProgressPercent)
                        .completed(overallProgressPercent >= 100)
                        .lastAccessed(LocalDateTime.now())
                        .build();
            } else {
                courseProgress.setProgressPercentage(Math.max(courseProgress.getProgressPercentage(), overallProgressPercent));
                if (overallProgressPercent >= 100) {
                    courseProgress.setCompleted(true);
                    if (courseProgress.getCompletedAt() == null) {
                        courseProgress.setCompletedAt(LocalDateTime.now());
                    }
                }
                courseProgress.setLastAccessed(LocalDateTime.now());
            }
            courseProgressRepository.save(courseProgress);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("lessonStatus", data.getLessonStatus());
        response.put("scoreRaw", data.getScoreRaw());
        response.put("suspendData", data.getSuspendData());
        response.put("location", data.getLessonLocation());
        return ResponseEntity.ok(response);
    }

    private static class ScormManifestInfo {
        String version = "1.2";
        String entryPoint = "index.html";
    }

    private ScormManifestInfo parseManifest(File manifestFile) {
        ScormManifestInfo info = new ScormManifestInfo();
        try {
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            dbFactory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(manifestFile);
            doc.getDocumentElement().normalize();

            // 1. Get Schema Version
            NodeList schemaList = doc.getElementsByTagName("schemaversion");
            if (schemaList.getLength() > 0) {
                String val = schemaList.item(0).getTextContent();
                if (val != null) {
                    if (val.contains("2004") || val.contains("1.3")) {
                        info.version = "2004";
                    } else {
                        info.version = "1.2";
                    }
                }
            } else {
                NodeList metadataList = doc.getElementsByTagName("metadata");
                if (metadataList.getLength() > 0) {
                    Element meta = (Element) metadataList.item(0);
                    NodeList subSchema = meta.getElementsByTagName("schemaversion");
                    if (subSchema.getLength() > 0) {
                        String val = subSchema.item(0).getTextContent();
                        if (val != null && (val.contains("2004") || val.contains("1.3"))) {
                            info.version = "2004";
                        }
                    }
                }
            }

            // 2. Get entry point href
            String refId = null;
            NodeList itemList = doc.getElementsByTagName("item");
            for (int i = 0; i < itemList.getLength(); i++) {
                Element item = (Element) itemList.item(i);
                String ref = item.getAttribute("identifierref");
                if (ref != null && !ref.trim().isEmpty()) {
                    refId = ref.trim();
                    break;
                }
            }

            NodeList resourceList = doc.getElementsByTagName("resource");
            if (refId != null) {
                for (int i = 0; i < resourceList.getLength(); i++) {
                    Element res = (Element) resourceList.item(i);
                    if (refId.equals(res.getAttribute("identifier"))) {
                        String href = res.getAttribute("href");
                        if (href != null && !href.trim().isEmpty()) {
                            info.entryPoint = href.trim().replace('\\', '/');
                            return info;
                        }
                    }
                }
            }

            for (int i = 0; i < resourceList.getLength(); i++) {
                Element res = (Element) resourceList.item(i);
                String href = res.getAttribute("href");
                if (href != null && !href.trim().isEmpty()) {
                    info.entryPoint = href.trim().replace('\\', '/');
                    break;
                }
            }
        } catch (Exception e) {
            System.err.println("[SCORM] Error parsing manifest: " + e.getMessage());
        }
        return info;
    }

    private void unzip(MultipartFile file, File destDir) throws IOException {
        byte[] buffer = new byte[4096];
        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry zipEntry = zis.getNextEntry();
            while (zipEntry != null) {
                File newFile = newFile(destDir, zipEntry);
                if (zipEntry.isDirectory()) {
                    if (!newFile.isDirectory() && !newFile.mkdirs()) {
                        throw new IOException("Failed to create directory: " + newFile);
                    }
                } else {
                    File parent = newFile.getParentFile();
                    if (!parent.isDirectory() && !parent.mkdirs()) {
                        throw new IOException("Failed to create directory: " + parent);
                    }
                    try (FileOutputStream fos = new FileOutputStream(newFile)) {
                        int len;
                        while ((len = zis.read(buffer)) > 0) {
                            fos.write(buffer, 0, len);
                        }
                    }
                }
                zipEntry = zis.getNextEntry();
            }
            zis.closeEntry();
        }
    }

    private File newFile(File destinationDir, ZipEntry zipEntry) throws IOException {
        File destFile = new File(destinationDir, zipEntry.getName());
        String destDirPath = destinationDir.getCanonicalPath();
        String destFilePath = destFile.getCanonicalPath();

        if (!destFilePath.startsWith(destDirPath + File.separator)) {
            throw new IOException("Entry is outside of the target dir: " + zipEntry.getName());
        }
        return destFile;
    }

    private void deleteDir(File file) {
        File[] contents = file.listFiles();
        if (contents != null) {
            for (File f : contents) {
                deleteDir(f);
            }
        }
        file.delete();
    }

    @GetMapping("/scorm-serve/{packageUuid}/**")
    public ResponseEntity<byte[]> serveScormFile(
            @PathVariable("packageUuid") String packageUuid,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        try {
            String fullPath = request.getRequestURI();
            String prefix = "/scorm-serve/" + packageUuid + "/";
            int idx = fullPath.indexOf(prefix);
            if (idx == -1) {
                return ResponseEntity.notFound().build();
            }
            String relativePath = fullPath.substring(idx + prefix.length());
            relativePath = java.net.URLDecoder.decode(relativePath, java.nio.charset.StandardCharsets.UTF_8.name());

            String s3Key = "scorm-packages/" + packageUuid + "/" + relativePath;

            if (s3Client == null) {
                return ResponseEntity.status(503).body("S3 client not initialized".getBytes());
            }

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(getObjectRequest);
            byte[] bytes = objectBytes.asByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.parseMediaType(determineContentType(relativePath)));
            headers.setContentLength(bytes.length);
            headers.setCacheControl("max-age=600");

            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
        } catch (NoSuchKeyException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Error loading file: " + e.getMessage()).getBytes());
        }
    }

    public void deletePackageFromS3(String packageUuid) {
        if (s3Client == null) return;
        try {
            String prefix = "scorm-packages/" + packageUuid + "/";
            ListObjectsV2Request listReq = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();
            ListObjectsV2Response listRes = s3Client.listObjectsV2(listReq);
            
            for (S3Object s3Obj : listRes.contents()) {
                DeleteObjectRequest delReq = DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(s3Obj.key())
                        .build();
                s3Client.deleteObject(delReq);
                System.out.println("[SCORM S3] Deleted S3 object: " + s3Obj.key());
            }
        } catch (Exception e) {
            System.err.println("[SCORM S3] Failed to delete package " + packageUuid + " from S3: " + e.getMessage());
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScormRuntimeDataUpdateRequest {
        private String lessonStatus;
        private Integer scoreRaw;
        private String suspendData;
        private String location;
    }
}
