// fictional but representative resume used by the "try a sample" affordance
// on the scanner page. plain text so it flows through parseResumeText with
// realistic section detection: experience with quantified bullets, education
// with GPA, dedicated skills section, certifications. lets a casual visitor
// experience the full scoring pipeline without uploading anything personal.
//
// keep this content evergreen (no specific years that age the example) and
// neutral (fictional name, no real company URLs). the goal is "good enough
// to score well" so visitors see a realistic high-score path.

export const SAMPLE_RESUME = `Alex Morgan
alex.morgan@example.com
Toronto, ON
linkedin.com/in/alex-morgan-example

SUMMARY
Senior software engineer with 7+ years of experience building scalable web applications. Strong background in TypeScript, Node.js, and cloud-native architectures. Led cross-functional teams and shipped products serving millions of users.

EXPERIENCE
Senior Software Engineer at Acme Cloud
Mar 2022 - Present
- Architected a multi-region API platform serving 12M monthly active users with 99.95% uptime
- Led migration from a monolith to microservices, reducing p99 latency from 850ms to 220ms
- Mentored 6 junior engineers; 4 promoted within 18 months
- Cut infrastructure costs 38% by introducing autoscaling policies and right-sizing compute

Software Engineer at Northwind Labs
Aug 2019 - Feb 2022
- Shipped a real-time analytics dashboard adopted by 1,400+ enterprise customers
- Wrote integration tests covering 92% of the payment service, eliminating a class of regressions
- Owned the on-call rotation for the data ingestion pipeline; reduced page volume 60% via SLO-driven alerting

Junior Software Engineer at Globex Systems
Jun 2017 - Jul 2019
- Built a customer-facing reporting tool used by 320 internal sales reps
- Contributed 47 merged pull requests in the first 6 months

EDUCATION
Bachelor of Science in Computer Science
University of Toronto
2013 - 2017
GPA: 3.85/4.0
Honors: Dean's List (4 semesters)

SKILLS
TypeScript, JavaScript, Python, Go, Node.js, React, Svelte, Next.js
PostgreSQL, Redis, Kafka, gRPC, GraphQL, REST
AWS, GCP, Docker, Kubernetes, Terraform, GitHub Actions
Agile, Scrum, code review, technical writing, mentorship

CERTIFICATIONS
AWS Certified Solutions Architect, Associate
Certified Kubernetes Application Developer (CKAD)

PROJECTS
Open-source resume scorer (github.com/example/scorer)
- TypeScript SvelteKit app, 2.4k stars on GitHub
- Parses PDFs in-browser, scores against six ATS profiles
`;
