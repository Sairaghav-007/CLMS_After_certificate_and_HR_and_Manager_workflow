package com.example.clms.config;

import com.example.clms.course.*;
import com.example.clms.user.User;
import com.example.clms.user.Role;
import com.example.clms.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CourseDataSeeder implements CommandLineRunner {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final QuestionRepository questionRepository;

    @Override
    public void run(String... args) {
        // Seed Users
        seedUser("admin@clms.com", "Admin User", Role.ADMIN, "Welcome@123", "Management", "Administrator");
        seedUser("hr@clms.com", "HR Specialist", Role.HR, "Welcome@123", "Human Resources", "HR Administrator");
        seedUser("manager@clms.com", "Sarah Mitchell", Role.MANAGER, "Welcome@123", "Engineering", "Engineering Manager");
        
        // Seed Employees
        seedUser("employee@clms.com", "John Doe", Role.EMPLOYEE, "Welcome@123", "Engineering", "Junior Developer");
        seedUser("alice@clms.com", "Alice Johnson", Role.EMPLOYEE, "Welcome@123", "Engineering", "Frontend Developer");
        seedUser("bob@clms.com", "Bob Smith", Role.EMPLOYEE, "Welcome@123", "Engineering", "DevOps Engineer");
        seedUser("charlie@clms.com", "Charlie Brown", Role.EMPLOYEE, "Welcome@123", "Engineering", "Quality Assurance");

        // Seed some specific states for employees
        User bob = userRepository.findByEmail("bob@clms.com").orElse(null);
        if (bob != null) {
            bob.setStatus("At Risk");
            userRepository.save(bob);
        }
        User charlie = userRepository.findByEmail("charlie@clms.com").orElse(null);
        if (charlie != null) {
            charlie.setStatus("Non-Compliant");
            userRepository.save(charlie);
        }

        // Seed Courses
        Course security = Course.builder()
                .title("Cyber Security Basics")
                .category("Mandatory")
                .description("Learn password safety, phishing detection, secure browsing, and reporting workflows.")
                .dueDate(LocalDate.now().plusDays(12))
                .active(true)
                .status("PUBLISHED")
                .build();

        CourseModule securityIntro = module(security, "Module 1: Security Foundations", 1);
        securityIntro.setSections(List.of(
                section(securityIntro, "Welcome video", MaterialType.VIDEO,
                        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", 1),
                section(securityIntro, "Security checklist PDF", MaterialType.PDF,
                        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", 2)
        ));

        CourseModule securityPolicy = module(security, "Module 2: Company Policy", 2);
        securityPolicy.setSections(List.of(
                section(securityPolicy, "Policy deck", MaterialType.PPT,
                        "https://file-examples.com/storage/fe5f98b931648c861fbd58b/2017/08/file_example_PPT_250kB.ppt", 1)
        ));
        security.setModules(List.of(securityIntro, securityPolicy));

        Course safety = Course.builder()
                .title("Workplace Safety")
                .category("Mandatory")
                .description("Understand workplace incident prevention, emergency procedures, and safety reporting.")
                .dueDate(LocalDate.now().plusDays(7))
                .active(true)
                .status("PUBLISHED")
                .build();

        CourseModule safetyModule = module(safety, "Module 1: Safety Essentials", 1);
        safetyModule.setSections(List.of(
                section(safetyModule, "Safety overview video", MaterialType.VIDEO,
                        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", 1),
                section(safetyModule, "Emergency procedure PDF", MaterialType.PDF,
                        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", 2)
        ));
        safety.setModules(List.of(safetyModule));

        Course leadership = Course.builder()
                .title("Leadership 101")
                .category("Elective")
                .description("Build communication habits, feedback skills, and people-management fundamentals.")
                .dueDate(LocalDate.now().plusDays(20))
                .active(true)
                .status("PUBLISHED")
                .build();

        CourseModule leadershipModule = module(leadership, "Module 1: Communication", 1);
        leadershipModule.setSections(List.of(
                section(leadershipModule, "Feedback guide PDF", MaterialType.PDF,
                        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", 1),
                section(leadershipModule, "Coaching basics video", MaterialType.VIDEO,
                        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", 2)
        ));
        leadership.setModules(List.of(leadershipModule));

        // Seed Course reviews
        Course cloud = Course.builder()
                .title("Cloud Computing Basics")
                .category("Department-Oriented")
                .description("Understanding AWS and CloudFront S3 deployments.")
                .dueDate(LocalDate.now().plusDays(40))
                .active(false)
                .status("PENDING_MANAGER_REVIEW")
                .createdBy("HR Specialist")
                .build();

        Course patterns = Course.builder()
                .title("Advanced Java Patterns")
                .category("Department-Oriented")
                .description("Build scalable Microservices architecture.")
                .dueDate(LocalDate.now().plusDays(40))
                .active(false)
                .status("ON_REVIEW")
                .createdBy("HR Specialist")
                .build();

        Course conduct = Course.builder()
                .title("Corporate Conduct Code")
                .category("Mandatory")
                .description("Ethical behavior and corporate values guide.")
                .dueDate(LocalDate.now().plusDays(40))
                .active(false)
                .status("REJECTED")
                .createdBy("HR Specialist")
                .build();

        if (!courseRepository.existsByTitleIgnoreCase(security.getTitle())) {
            courseRepository.save(security);
        }

        if (!courseRepository.existsByTitleIgnoreCase(safety.getTitle())) {
            courseRepository.save(safety);
        }

        if (!courseRepository.existsByTitleIgnoreCase(leadership.getTitle())) {
            courseRepository.save(leadership);
        }

        if (!courseRepository.existsByTitleIgnoreCase(cloud.getTitle())) {
            courseRepository.save(cloud);
        }

        if (!courseRepository.existsByTitleIgnoreCase(patterns.getTitle())) {
            courseRepository.save(patterns);
        }

        if (!courseRepository.existsByTitleIgnoreCase(conduct.getTitle())) {
            courseRepository.save(conduct);
        }

        // Fetch course records from DB to seed questions
        seedQuestionsForSeededCourses();
    }

    private void seedQuestionsForSeededCourses() {
        courseRepository.findAll().forEach(course -> {
            if (questionRepository.findByCourseId(course.getId()).isEmpty()) {
                if ("Cyber Security Basics".equalsIgnoreCase(course.getTitle())) {
                    seedQuestion(course.getId(), "What is the recommended minimum length for a secure corporate password?", "6 characters", "12-16 characters with mixed case, numbers, and symbols", "4 digits", "8 letters", "B");
                    seedQuestion(course.getId(), "If you receive an urgent email from the 'CEO' asking for immediate iTunes gift cards, what is this?", "Phishing attempt", "Standard CEO request", "A bonus allocation", "None of the above", "A");
                    seedQuestion(course.getId(), "Writing your passwords on a sticky note under your keyboard is a safe corporate practice.", "True", "False", "", "", "B");
                } else if ("Workplace Safety".equalsIgnoreCase(course.getTitle())) {
                    seedQuestion(course.getId(), "What is the primary action during an active fire alarm?", "Call friends", "Evacuate calmly via stairs", "Use elevators", "Ignore it", "B");
                    seedQuestion(course.getId(), "Who should you report a workplace safety hazard to?", "Manager / Safety Officer", "Customers", "Family", "No one", "A");
                    seedQuestion(course.getId(), "Proper ergonomics includes keeping your monitor at eye level.", "True", "False", "", "", "A");
                } else if ("Leadership 101".equalsIgnoreCase(course.getTitle())) {
                    seedQuestion(course.getId(), "Which style of communication builds trust?", "Aggressive", "Open and empathetic", "Silent", "Demanding", "B");
                    seedQuestion(course.getId(), "What does constructive feedback focus on?", "Personal character", "Specific behaviors and improvement", "Criticizing past errors", "Employee status", "B");
                    seedQuestion(course.getId(), "A good leader should delegate tasks and support team autonomy.", "True", "False", "", "", "A");
                } else if ("Cloud Computing Basics".equalsIgnoreCase(course.getTitle())) {
                    seedQuestion(course.getId(), "Which AWS service is primary for storing static web assets?", "EC2", "S3", "RDS", "DynamoDB", "B");
                    seedQuestion(course.getId(), "CloudFront is AWS's Content Delivery Network (CDN) service.", "True", "False", "", "", "A");
                } else if ("Advanced Java Patterns".equalsIgnoreCase(course.getTitle())) {
                    seedQuestion(course.getId(), "Which pattern is used to create complex objects step-by-step?", "Factory", "Builder", "Singleton", "Prototype", "B");
                    seedQuestion(course.getId(), "In Spring Boot, which annotation registers a class as a bean in the context?", "@Component", "@Autowired", "@Value", "@Id", "A");
                } else if ("Corporate Conduct Code".equalsIgnoreCase(course.getTitle())) {
                    seedQuestion(course.getId(), "Conflict of interest should always be disclosed to compliance.", "True", "False", "", "", "A");
                    seedQuestion(course.getId(), "Accepting expensive gifts from suppliers violates corporate values.", "True", "False", "", "", "A");
                } else {
                    // Seed standard generic questions for any other courses (e.g. created by HR later)
                    seedQuestion(course.getId(), "What is the core target of learning " + course.getTitle() + "?", "To gain knowledge and follow proper workplace procedures", "To finish training with no operational changes", "None of the above", "All of the above", "A");
                    seedQuestion(course.getId(), "Reviewing corporate compliance training is a continuous requirement.", "True", "False", "", "", "A");
                    seedQuestion(course.getId(), "Who oversees and validates that corporate training audits pass?", "External general public", "The compliance management board and HR", "Third-party vendors", "None of the above", "B");
                }
            }
        });
    }

    private void seedQuestion(Long courseId, String q, String a, String b, String c, String d, String correct) {
        Question question = Question.builder()
                .courseId(courseId)
                .question(q)
                .optionA(a)
                .optionB(b)
                .optionC(c)
                .optionD(d)
                .correctAnswer(correct)
                .build();
        questionRepository.save(question);
    }

    private void seedUser(String email, String name, Role role, String password, String dept, String designation) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = User.builder()
                    .email(email)
                    .fullName(name)
                    .role(role)
                    .password(passwordEncoder.encode(password))
                    .active(true)
                    .department(dept)
                    .designation(designation)
                    .build();
            userRepository.save(user);
        }
    }

    private CourseModule module(Course course, String title, int order) {
        return CourseModule.builder()
                .course(course)
                .title(title)
                .moduleOrder(order)
                .build();
    }

    private CourseSection section(CourseModule module, String title, MaterialType type, String materialUrl, int order) {
        return CourseSection.builder()
                .module(module)
                .title(title)
                .materialType(type)
                .materialUrl(materialUrl)
                .sectionOrder(order)
                .build();
    }
}
