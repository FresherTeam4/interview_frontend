import type { InterviewTemplate } from '@/types/template'

export const PRESET_TEMPLATES: InterviewTemplate[] = [
  {
    id: -1, // ID ảo cho preset
    title: 'Java Backend Fresher / Junior',
    jobTitle: 'Java Backend Developer',
    targetSeniority: 'FRESHER',
    confirmed: true,
    published: true,
    version: 1,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    content: {
      sufficientJobContext: true,
      jobTitle: 'Java Backend Developer',
      targetSeniority: 'FRESHER',
      domain: 'Backend Engineering',
      summary:
        'Vị trí lập trình viên Java Backend Fresher/Junior tập trung vào nền tảng OOP, Collections, Java 17+, xây dựng RESTful API với Spring Boot, tương tác CSDL quan hệ với Spring Data JPA.',
      keySkills: [
        {
          name: 'Java Core & OOP',
          level: 'MUST_HAVE',
          description: 'Nắm vững 4 tính chất OOP, Collections Framework, Exception Handling và Java 8+ features (Streams, Lambda).',
        },
        {
          name: 'Spring Boot & RESTful API',
          level: 'MUST_HAVE',
          description: 'Xây dựng API CRUD, Dependency Injection, Controller/Service/Repository architecture, validation.',
        },
        {
          name: 'Relational Database & SQL',
          level: 'MUST_HAVE',
          description: 'Thiết kế bảng, viết câu lệnh SQL (JOIN, GROUP BY, subquery), hiểu Index và Transaction cơ bản.',
        },
        {
          name: 'Spring Data JPA / Hibernate',
          level: 'NICE_TO_HAVE',
          description: 'Entity mapping, quan hệ OneToMany/ManyToMany, JPQL và giải quyết N+1 query problem cơ bản.',
        },
        {
          name: 'Git & Clean Code',
          level: 'NICE_TO_HAVE',
          description: 'Quản lý mã nguồn với Git, tuân thủ quy ước đặt tên và các nguyên lý SOLID căn bản.',
        },
      ],
    },
  },
  {
    id: -2,
    title: 'React / Frontend Developer (Junior)',
    jobTitle: 'Frontend React Developer',
    targetSeniority: 'JUNIOR',
    confirmed: true,
    published: true,
    version: 1,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    content: {
      sufficientJobContext: true,
      jobTitle: 'Frontend React Developer',
      targetSeniority: 'JUNIOR',
      domain: 'Frontend Engineering',
      summary:
        'Phát triển giao diện web SPA hiện đại với React, TypeScript, TailwindCSS, kết nối REST API, quản lý State và tối ưu trải nghiệm người dùng.',
      keySkills: [
        {
          name: 'React Hooks & Component Lifecycle',
          level: 'MUST_HAVE',
          description: 'Sử dụng thành thạo useState, useEffect, useMemo, useCallback và custom hooks.',
        },
        {
          name: 'TypeScript trong React',
          level: 'MUST_HAVE',
          description: 'Định nghĩa props, events, API types chặt chẽ, tránh sử dụng any.',
        },
        {
          name: 'TailwindCSS & Responsive Layout',
          level: 'MUST_HAVE',
          description: 'Xây dựng UI responsive cho mobile/desktop, sử dụng Flexbox, CSS Grid và Design Tokens.',
        },
        {
          name: 'Server State & API Calling',
          level: 'MUST_HAVE',
          description: 'Sử dụng React Query (TanStack Query) hoặc Axios với caching, pagination và error handling.',
        },
        {
          name: 'Next.js & Performance Optimization',
          level: 'NICE_TO_HAVE',
          description: 'Hiểu về SSR, SSG, lazy loading hình ảnh/component để tối ưu điểm Core Web Vitals.',
        },
      ],
    },
  },
  {
    id: -3,
    title: 'Middle Java / Spring Boot Engineer',
    jobTitle: 'Senior Java Backend Engineer',
    targetSeniority: 'MIDDLE',
    confirmed: true,
    published: true,
    version: 1,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    content: {
      sufficientJobContext: true,
      jobTitle: 'Java Backend Engineer',
      targetSeniority: 'MIDDLE',
      domain: 'Enterprise Architecture',
      summary:
        'Thiết kế và tối ưu hệ thống backend chịu tải cao, Microservices, cơ chế Transaction, Caching phân tán và bảo mật OAuth2/JWT.',
      keySkills: [
        {
          name: 'Microservices & Spring Cloud',
          level: 'MUST_HAVE',
          description: 'API Gateway, Service Discovery, Circuit Breaker (Resilience4j) và phân chia domain nghiệp vụ.',
        },
        {
          name: 'Database Optimization & Indexing',
          level: 'MUST_HAVE',
          description: 'Tối ưu Query Execution Plan, Index types, Partitioning và xử lý lock contention.',
        },
        {
          name: 'Message Broker (Kafka / RabbitMQ)',
          level: 'MUST_HAVE',
          description: 'Xây dựng kiến trúc Event-Driven, đảm bảo At-least-once delivery và xử lý Idempotency.',
        },
        {
          name: 'Redis Caching & Distributed Locks',
          level: 'NICE_TO_HAVE',
          description: 'Chiến lược Cache-Aside, Write-Through, phòng chống Cache Avalanche/Stampede.',
        },
        {
          name: 'Docker & Kubernetes Fundamentals',
          level: 'NICE_TO_HAVE',
          description: 'Đóng gói container tối ưu kích thước, cấu hình K8s Deployment, Service và ConfigMap.',
        },
      ],
    },
  },
  {
    id: -4,
    title: 'Fullstack Web Engineer (Node & React)',
    jobTitle: 'Fullstack JavaScript Developer',
    targetSeniority: 'JUNIOR',
    confirmed: true,
    published: true,
    version: 1,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    content: {
      sufficientJobContext: true,
      jobTitle: 'Fullstack JavaScript Developer',
      targetSeniority: 'JUNIOR',
      domain: 'Fullstack Web',
      summary:
        'Phát triển ứng dụng web end-to-end với Node.js, Express/NestJS ở backend và React ở frontend, kết nối PostgreSQL/MongoDB.',
      keySkills: [
        {
          name: 'Node.js & Express / NestJS',
          level: 'MUST_HAVE',
          description: 'Hiểu kiến trúc Event Loop, Async/Await, Middleware, Routing và Validation.',
        },
        {
          name: 'React & State Management',
          level: 'MUST_HAVE',
          description: 'Xây dựng UI tương tác phong phú, tích hợp form và API calls mượt mà.',
        },
        {
          name: 'Database & ORM (Prisma / TypeORM)',
          level: 'MUST_HAVE',
          description: 'Thiết kế schema dữ liệu, Migration, quan hệ và tối ưu truy vấn.',
        },
        {
          name: 'Authentication (JWT & OAuth2)',
          level: 'MUST_HAVE',
          description: 'Triển khai xác thực người dùng, Refresh Token và phân quyền Role-based Access Control.',
        },
      ],
    },
  },
  {
    id: -5,
    title: 'QA / Automation Test Engineer',
    jobTitle: 'Automation Test Engineer',
    targetSeniority: 'JUNIOR',
    confirmed: true,
    published: true,
    version: 1,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    content: {
      sufficientJobContext: true,
      jobTitle: 'Automation Test Engineer',
      targetSeniority: 'JUNIOR',
      domain: 'Quality Assurance',
      summary:
        'Thiết kế kịch bản kiểm thử tự động cho Web và API, đảm bảo chất lượng phần mềm và tích hợp vào quy trình CI/CD.',
      keySkills: [
        {
          name: 'API Testing (Postman / REST Assured)',
          level: 'MUST_HAVE',
          description: 'Kiểm thử hợp đồng API, status code, payload validation và automation collection.',
        },
        {
          name: 'UI Automation (Selenium / Playwright)',
          level: 'MUST_HAVE',
          description: 'Page Object Model (POM), Locator strategies, xử lý async events và assertions.',
        },
        {
          name: 'Test Design & Bug Reporting',
          level: 'MUST_HAVE',
          description: 'Áp dụng phân vùng tương đương, giá trị biên, viết Test Case và Bug Report rõ ràng.',
        },
        {
          name: 'CI/CD Pipeline Integration',
          level: 'NICE_TO_HAVE',
          description: 'Tự động chạy test suite khi push code qua GitHub Actions hoặc Jenkins.',
        },
      ],
    },
  },
]
