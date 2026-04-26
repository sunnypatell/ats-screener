// fictional but representative resume + paired job description, used by the
// "try a sample" affordances on the scanner page. plain text so they flow
// through parseResumeText / parseJobDescription with realistic structure
// (sections, requirements, keywords). lets a casual visitor experience both
// the general and targeted scoring pipelines without uploading anything
// personal or hunting for a real job posting.
//
// keep this content evergreen (no specific years that age the example) and
// neutral (fictional names, no real company URLs). the resume is sized to
// score well so the demo lands a realistic high score.

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

// matching sample job description. lets the user click "Try sample JD"
// to demo the targeted-scoring path. content mirrors the resume's
// strongest signals (TypeScript, AWS, scalable systems, mentorship)
// so the targeted score lands in a realistic range against the
// sample resume (versus a wildly mismatched JD which would obscure
// the demo).
export const SAMPLE_JD = `Senior Software Engineer

We are hiring a senior software engineer to lead the platform team. You will design and build scalable services that power our core product, mentor engineers, and own end-to-end reliability for high-traffic features.

Responsibilities:
- Architect and ship distributed services in TypeScript or Go
- Lead migrations from legacy monoliths to modern microservices
- Drive observability, autoscaling, and cost-efficiency improvements
- Mentor mid-level engineers and review code with care
- Own incident response for the platform on-call rotation

Required:
- 5+ years building production web applications at scale
- Strong TypeScript or JavaScript experience
- Deep familiarity with AWS (EC2, ECS, RDS, S3, IAM)
- Experience with Docker and Kubernetes in production
- Track record of mentoring engineers and growing teams
- Bachelor's degree in Computer Science or equivalent experience

Nice to have:
- Experience with Svelte, Next.js, or other modern frameworks
- gRPC or GraphQL API design
- Background in resume parsing, ATS systems, or HR tech
- Public open-source contributions

Tech stack: TypeScript, Node.js, React, AWS, Docker, Kubernetes, PostgreSQL, Redis, Kafka.
`;
