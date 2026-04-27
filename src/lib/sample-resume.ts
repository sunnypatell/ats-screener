// sample job description used by the "try with a sample job description"
// button in JobDescriptionInput. populates the JD textarea so a visitor
// can experience targeted scoring without writing a JD from scratch.
// the prior SAMPLE_RESUME export was removed because that affordance
// auto-fired a real LLM scan and burned API quota on a fake resume.
//
// keep this content evergreen (no specific years that age the example)
// and neutral (no real company URLs).

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
