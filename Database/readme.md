Corporate Learning Management System (CLMS)

A secure, enterprise-grade Corporate Learning Management System (CLMS) built using React, TypeScript, and Tailwind CSS to enable organizations to deliver, manage, and track employee learning effectively.

⸻

📌 Overview

CLMS is designed to provide employees with a seamless learning experience while giving administrators complete control over course delivery, assessments, certifications, and compliance tracking.

The platform supports:

* Mandatory training
* Elective learning
* Department-oriented courses
* Sequential learning paths
* Secure content delivery
* Quiz-based assessments
* Certification generation
* Employee learning analytics

⸻

🚀 Features

Employee Course Dashboard

* View all available courses.
* Categorized courses:
    * Mandatory
    * Elective
    * Department-Oriented
* Course search functionality.
* Advanced filtering.
* Responsive course cards.
* Progress indicators.

⸻

Course Preview

Before enrollment, employees can:

* View course overview.
* Check duration.
* View learning objectives.
* Review module structure.
* See completion requirements.
* Understand passing criteria.

⸻

Sequential Learning

Modules follow a strict sequence.

Example:

Module 1 → Module 2 → Module 3 → Quiz

Rules:

* Employees cannot skip modules.
* Next module unlocks only after completing the previous module.
* Progress is automatically saved.

⸻

Secure Learning Player

Supports:

* Video
* PDF
* PPT

Features:

Video

* Play/Pause
* Fast Forward
* Rewind
* Playback speed control
* Adaptive quality:
    * 1080p
    * 720p
    * 480p
* Automatic resolution switching based on network quality.

Restrictions:

* Timeline seeking disabled.
* Download disabled.
* Sequential access enforced.

⸻

Enterprise Content Protection

Videos

Recommended:

* Widevine DRM
* FairPlay DRM
* PlayReady DRM

Additional safeguards:

* Dynamic employee watermark.
* DevTools detection.
* Keyboard shortcut blocking.
* Right-click prevention.
* Pause when browser tab loses focus.

⸻

PDFs and PPTs

Documents are delivered through secure viewers.

Features:

* No direct file exposure.
* Image-based rendering.
* Download restrictions.
* Dynamic watermarking.
* Copy prevention.
* Blur on tab switching.

⸻

📝 Learning Notes

Employees can take notes during training.

Features:

* Timestamp-based notes.
* Module association.
* Edit notes.
* Delete notes.
* Search notes.
* Pin important notes.

Pinned notes always appear at the top.

⸻

PDF Export

Export notes as professional PDF documents.

Includes:

* Course Name
* Employee Name
* Export Date
* Timestamp
* Module Name
* Pinned Status
* Note Content

Generated using:

* jsPDF
* jspdf-autotable

⸻

🧠 Quiz & Assessments

After completing all modules:

Employees must take assessments.

Features:

* Multiple-choice questions.
* Configurable passing score.
* Attempt limits.
* Instant evaluation.
* Detailed feedback.
* Automatic progression.

Outcomes:

Pass

* Course marked completed.
* Certificate generated.

Fail

* Reattempt allowed based on predefined settings.

⸻

🏆 Certificates

Certificates are automatically issued upon successful completion.

Certificate contains:

* Employee Name
* Course Name
* Completion Date
* Certificate ID
* Organization Branding

Employees can:

* Download certificates.
* View completion history.

⸻

📊 Employee Progress Tracking

Track:

* Courses enrolled.
* Courses completed.
* In-progress courses.
* Quiz scores.
* Certificates earned.
* Module completion percentages.

⸻

🔒 Security Features

Browser Level

* Disable right-click.
* Block common developer shortcuts.
* DevTools detection.
* Pause content when focus is lost.

Content Level

* DRM support.
* Dynamic watermarking.
* Secure viewers.

Organizational Level

Recommended deployment:

* Company-managed devices.
* Secure browsers.
* Identity-based access.

⸻

🛠 Technology Stack

Frontend

* React 18
* TypeScript
* Tailwind CSS
* React Router
* Zustand
* TanStack Query
* Lucide React

Content Delivery

* Shaka Player
* HLS/DASH Streaming
* DRM Integration

Document Features

* jsPDF
* jspdf-autotable

State Management

* Zustand

Data Fetching

* TanStack Query

⸻

📂 Project Structure

src/
├── features/
│   ├── employee-dashboard/
│   ├── learning-player/
│   ├── quizzes/
│   ├── certificates/
│   └── assessments/
├── hooks/
├── services/
├── store/
├── components/
├── layouts/
├── routes/
└── utils/

⸻

⚙ Installation

Clone the repository:

git clone <repository-url>

Navigate to the project:

cd CLMS

Install dependencies:

npm install

Start development server:

npm run dev

Build production bundle:

npm run build

Preview production build:

npm run preview

⸻

🎯 Future Enhancements

* AI-based learning recommendations.
* Gamification and badges.
* Discussion forums.
* Manager approval workflows.
* Learning analytics dashboards.
* Mobile applications.
* Offline learning support.
* SCORM/xAPI compliance.
* Multi-language support.
* Integration with HRMS systems.

⸻

👨‍💻 Developed For

Corporate Learning and Compliance Training environments requiring secure, scalable, and employee-centric learning experiences.

⸻

📄 License

This project is intended for educational and enterprise demonstration purposes. Customize licensing terms based on organizational requirements.
