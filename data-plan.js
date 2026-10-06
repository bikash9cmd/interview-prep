window.PREP = window.PREP || {};
window.PREP.plan = [
  { id: "w1", start: "2026-10-05", track: "linux", title: "Linux foundations",
    tasks: ["Read: kernel/distro/shell, filesystem layout, paths", "Practise the Navigate, Files and Read text commands until you type them without looking", "Do Linux Lab 1", "Answer the first 5 Linux questions out loud, then check"] },
  { id: "w2", start: "2026-10-12", track: "linux", title: "Permissions, users, processes",
    tasks: ["Read: users and sudo, permissions, processes and signals, streams", "Do Linux Lab 2", "Explain chmod 754 to an imaginary interviewer in under 30 seconds", "Drill all basic Linux cards until 'Know it'"] },
  { id: "w3", start: "2026-10-19", track: "linux", title: "Services, logs, networking, SSH",
    tasks: ["Read: systemd, networking basics, SSH, environment variables", "Do Linux Lab 3", "Make an SSH key, add it to GitHub, test with ssh -T", "Answer the 'API on port 8000 does not respond' scenario without notes"] },
  { id: "w4", start: "2026-10-26", track: "linux", title: "Scripting and the container bridge",
    tasks: ["Read: scripting, disk and memory, links, cron, long jobs, namespaces and cgroups", "Do Linux Labs 4 and 5", "Answer every Linux scenario question", "Run one Linux mock interview below"] },
  { id: "w5", start: "2026-11-02", track: "git", title: "Git foundations",
    tasks: ["Read: Git vs GitHub, three areas, commits, branches, remotes, .gitignore", "Do Git Lab 1", "Write 5 commits with Conventional Commit messages", "Drill all basic Git cards"] },
  { id: "w6", start: "2026-11-09", track: "git", title: "Merge, rebase, undo",
    tasks: ["Read: merging and conflicts, rebase vs merge, undoing things, stash and friends", "Do Git Labs 2, 3 and 4", "Explain reset vs revert with a drawing on paper", "Answer every Git scenario question"] },
  { id: "w7", start: "2026-11-16", track: "git", title: "GitHub, PRs and Actions",
    tasks: ["Read: pull requests, branching strategies, GitHub Actions, secrets and large files", "Do Git Lab 5 (real repo, real CI)", "Write a PR description you would be proud to show", "Run one Git mock interview"] },
  { id: "w8", start: "2026-11-23", track: "docker", title: "Docker foundations",
    tasks: ["Read: why containers, container vs VM, image vs container, Dockerfile, layers, running, registries", "Do Docker Labs 1 and 2", "Push your image to Docker Hub or GHCR", "Drill all basic Docker cards"] },
  { id: "w9", start: "2026-11-30", track: "docker", title: "Volumes, networks, Compose + internship wrap-up",
    tasks: ["Read: volumes, networking, Docker Compose", "Do Docker Lab 3", "Internship ends 3 Dec: write down 3 projects you shipped, the problem, your part, the result", "Turn each into a STAR story (see Interview tips)"] },
  { id: "w10", start: "2026-12-07", track: "docker", title: "Production Docker and AI containers",
    tasks: ["Read: CMD vs ENTRYPOINT, multi-stage, security, health and limits, Docker for AI", "Do Docker Labs 4 and 5", "Answer every Docker scenario question", "Run one Docker mock interview"] },
  { id: "w11", start: "2026-12-14", track: "all", title: "Capstone project",
    tasks: ["Build a small FastAPI service that calls an LLM API (or a local Ollama model)", "Dockerfile + compose.yaml with a database or vector store", "GitHub Actions: test, build image, push with the commit SHA tag", "Deploy to a free-tier cloud VM over SSH; write a clear README with a diagram"] },
  { id: "w12", start: "2026-12-21", track: "all", title: "Cloud bridge",
    tasks: ["Learn AWS core: IAM, EC2, S3, VPC and security groups, ECR, ECS or Cloud Run", "Read what Kubernetes Pods, Deployments and Services are", "Connect each to what you know: security group = firewall, ECR = registry, Pod = container(s)", "Light week: keep a 20 minute daily card drill"] },
  { id: "w13", start: "2026-12-28", track: "all", title: "Full revision",
    tasks: ["Drill every card still marked 'Review'", "One mock interview per day, rotate topics", "Re-run one lab per topic from memory, no notes", "Re-read your STAR stories and capstone README"] },
  { id: "w14", start: "2027-01-04", track: "all", title: "Interview mode",
    tasks: ["Two mock interviews per day, intermediate level", "Practise the 60 second introduction until it is natural", "Prepare 3 questions to ask each company", "Update resume: internship, capstone link, skills with real examples"] }
];

window.PREP.next = [
  { t: "Python for automation and APIs", d: "Scripts, FastAPI, requests, async basics. Almost every Cloud + AI job uses Python as glue." },
  { t: "One cloud provider (AWS is the most asked)", d: "IAM (users, roles, policies), EC2, S3, VPC and security groups, ECR, ECS or Lambda. Aim for the AWS Cloud Practitioner or Solutions Architect Associate syllabus." },
  { t: "Kubernetes", d: "Pods, Deployments, Services, ConfigMaps, Secrets, Ingress, kubectl. Your Docker knowledge maps directly." },
  { t: "Infrastructure as Code", d: "Terraform: describe cloud resources in files, review them in PRs, apply them in CI. Git skills reused." },
  { t: "CI/CD and observability", d: "GitHub Actions pipelines, then logs, metrics and alerts with CloudWatch or Prometheus and Grafana." },
  { t: "AI serving and MLOps", d: "LLM APIs, RAG with a vector database, model serving (vLLM, Ollama), GPU instances, cost and latency trade-offs." }
];

window.PREP.tips = [
  { t: "Answer shape for any concept question",
    p: "1) One-line definition. 2) How it works, in two or three sentences. 3) A real example, ideally from your internship. 4) One trade-off or pitfall. Stop there and let them ask more. Example: 'A volume is storage Docker manages outside the container. Containers are disposable, so the database writes to a volume mounted at its data folder. In my internship our dev stack used bind mounts so code changes appeared live. The pitfall: compose down -v deletes the volume.'" },
  { t: "Scenario and troubleshooting questions",
    p: "Think aloud. Start with what you would check first and why, go from cheap checks to deep ones, and name the exact command each time. Interviewers grade the method more than the final answer. Ask a clarifying question if the scenario is vague: 'Is this on one server or in Kubernetes?'" },
  { t: "When you do not know",
    p: "Say so, then reason: 'I have not used that, but I would expect it to work like X because Y, and I would confirm with man or the docs.' Guessing with confidence is worse than honest reasoning." },
  { t: "STAR stories for behavioral questions",
    p: "Situation (one sentence of context), Task (your responsibility), Action (what YOU did, with tools and decisions), Result (a number or a clear outcome, plus what you learned). Prepare stories for: a bug you fixed, a conflict or review feedback you handled, something you learned fast, a mistake you made and fixed." },
  { t: "60 second introduction template",
    p: "'I am [Your name]. I recently finished a software engineering internship at [Company], where I built [one concrete project and its impact]. I worked in Docker-based dev environments, used one Git branch and PR per ticket, and [one more skill]. I want to work where cloud infrastructure and AI meet, because [your real reason]. Recently I built [capstone], a containerised LLM service with CI on GitHub Actions.'" },
  { t: "Questions to ask the interviewer",
    p: "How do you deploy models or AI services today? What does a new engineer's first month look like? How do code review and on-call work here? What is the biggest infrastructure problem the team is solving this year?" }
];
