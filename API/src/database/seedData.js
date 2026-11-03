// Seed fixtures for USOF.
// Default password for all seed users (user1 .. user7)
const TEST_PASSWORD = 'Password123!';

const seedUsers = [
    { login: 'user1', fullName: 'Alex Miller', email: 'user1@example.com' },
    { login: 'user2', fullName: 'Sophia Chen', email: 'user2@example.com' },
    { login: 'user3', fullName: 'Dmytro Kovalenko', email: 'user3@example.com' },
    { login: 'user4', fullName: 'Emma Watson', email: 'user4@example.com' },
    { login: 'user5', fullName: 'Lucas Silva', email: 'user5@example.com' },
    { login: 'user6', fullName: 'Anna Nowak', email: 'user6@example.com' },
    { login: 'user7', fullName: 'Max Polyakov', email: 'user7@example.com' }
];

const standardCategories = [
    {
        title: 'JavaScript',
        description: 'Core language features, event loop, promises, ES6+, prototypes, and browser runtime.'
    },
    {
        title: 'Node.js',
        description: 'Server-side JavaScript runtime, event-driven architecture, streams, file system, and Express.js.'
    },
    {
        title: 'React',
        description: 'Component architecture, hooks, state management, Virtual DOM, and modern frontend development.'
    },
    {
        title: 'TypeScript',
        description: 'Statically typed superset of JavaScript providing interfaces, generics, and compile-time verification.'
    },
    {
        title: 'MySQL',
        description: 'Relational database management, SQL queries, indexes, normalization, foreign keys, and transactions.'
    },
    {
        title: 'Python',
        description: 'High-level language for backend web development (FastAPI, Django, Flask), scripting, and automation.'
    },
    {
        title: 'Docker',
        description: 'Containerization, Dockerfiles, multi-container setups with compose, and isolated environments.'
    },
    {
        title: 'Web Security',
        description: 'Authentication, authorization, JWT tokens, XSS, CSRF, encryption, and secure programming practices.'
    },
    {
        title: 'CSS & UI Styling',
        description: 'CSS Modules, Flexbox, CSS Grid layouts, animations, and responsive web interface design.'
    },
    {
        title: 'Testing',
        description: 'Unit testing, integration testing, mocking, assertions, and test-driven development (TDD).'
    }
];

const seedQuestions = [
    {
        authorLogin: 'user1',
        categoryTitles: ['Node.js', 'JavaScript'],
        title: 'How does the Node.js event loop handle microtasks vs macrotasks?',
        content: "I'm debugging an asynchronous flow and noticed that `Promise.then` callbacks run before `setTimeout(..., 0)`.\n\nWhat is the exact execution priority in the Node.js event loop?",
        status: 'active',
        publishDate: '2026-10-25 10:15:00',
        answers: [
            {
                authorLogin: 'user2',
                content: 'Promise resolutions run in the Microtask Queue, which drains immediately after the current operation finishes and before moving to timers (macrotasks). Therefore, promises always execute before `setTimeout`.',
                isSolution: true,
                publishDate: '2026-10-25 10:45:00',
                replies: [
                    {
                        authorLogin: 'user1',
                        content: 'Thank you! That explains why my timer was executed later than expected.',
                        publishDate: '2026-10-25 11:10:00'
                    }
                ]
            },
            {
                authorLogin: 'user3',
                content: 'Additionally, `process.nextTick` callbacks have an even higher priority in Node.js and run before Promise microtasks!',
                isSolution: false,
                publishDate: '2026-10-25 11:30:00',
                replies: []
            }
        ],
        likers: ['user2', 'user3', 'user4', 'user5']
    },
    {
        authorLogin: 'user2',
        categoryTitles: ['React', 'JavaScript'],
        title: 'When should I use React useMemo instead of regular variables?',
        content: "I often see developers wrapping every calculation in `useMemo`. Is there an actual performance overhead when overusing it?",
        status: 'active',
        publishDate: '2026-10-26 14:20:00',
        answers: [
            {
                authorLogin: 'user1',
                content: "`useMemo` has memory overhead and requires dependency comparison on every render. Only use it for expensive computations (e.g. filtering thousands of items) or to keep stable object references for child dependencies.",
                isSolution: true,
                publishDate: '2026-10-26 14:55:00',
                replies: []
            },
            {
                authorLogin: 'user4',
                content: 'Exactly. For simple math or string concatenation, `useMemo` actually slows down the component due to caching overhead.',
                isSolution: false,
                publishDate: '2026-10-26 15:15:00',
                replies: []
            }
        ],
        likers: ['user1', 'user3', 'user4', 'user6', 'user7']
    },
    {
        authorLogin: 'user3',
        categoryTitles: ['MySQL'],
        title: 'How do composite indexes work in MySQL with multi-column queries?',
        content: "If I create an index on `(status, created_at, category_id)`, will MySQL use it if my query only filters by `created_at`?",
        status: 'active',
        publishDate: '2026-10-27 09:10:00',
        answers: [
            {
                authorLogin: 'user5',
                content: 'No, MySQL adheres to the leftmost prefix rule. If the first indexed column (`status`) is missing from the WHERE clause, the index cannot be utilized. You would need a separate index on `created_at`.',
                isSolution: true,
                publishDate: '2026-10-27 09:40:00',
                replies: []
            },
            {
                authorLogin: 'user6',
                content: 'You can verify how MySQL uses your indexes by running `EXPLAIN SELECT ...` in the MySQL CLI.',
                isSolution: false,
                publishDate: '2026-10-27 10:05:00',
                replies: []
            }
        ],
        likers: ['user1', 'user2', 'user5']
    },
    {
        authorLogin: 'user4',
        categoryTitles: ['TypeScript'],
        title: 'TypeScript interface vs type: which one to prefer for API models?',
        content: "Both interfaces and type aliases can define object shapes in TypeScript. Are there performance differences or architectural rules on when to use which?",
        status: 'active',
        publishDate: '2026-10-28 12:00:00',
        answers: [
            {
                authorLogin: 'user2',
                content: 'Prefer `interface` for object models and public API contracts because interfaces support declaration merging and compile faster in TypeScript compiler. Use `type` for unions, primitives, and tuples.',
                isSolution: true,
                publishDate: '2026-10-28 12:35:00',
                replies: []
            }
        ],
        likers: ['user1', 'user2', 'user3', 'user5', 'user6']
    },
    {
        authorLogin: 'user5',
        categoryTitles: ['Docker'],
        title: 'How to properly configure Docker network for Node backend and MySQL?',
        content: "My Express application fails to connect to MySQL when running inside Docker containers with connection refused on localhost:3306.",
        status: 'active',
        publishDate: '2026-10-29 16:45:00',
        answers: [
            {
                authorLogin: 'user7',
                content: 'Inside Docker, `localhost` refers to the container itself. Put both containers on a user-defined bridge network in `docker-compose.yml` and use the MySQL service name as the host instead of `localhost`.',
                isSolution: true,
                publishDate: '2026-10-29 17:15:00',
                replies: []
            },
            {
                authorLogin: 'user3',
                content: 'Also make sure to configure `depends_on: [db]` and check healthcheck status so the API waits for MySQL initialization.',
                isSolution: false,
                publishDate: '2026-10-29 17:40:00',
                replies: []
            }
        ],
        likers: ['user1', 'user4', 'user7']
    },
    {
        authorLogin: 'user6',
        categoryTitles: ['Web Security'],
        title: 'Best practices for storing authentication tokens on the frontend?',
        content: "Should JWT tokens be stored in localStorage or in httpOnly secure cookies to prevent XSS attacks?",
        status: 'active',
        publishDate: '2026-10-30 11:20:00',
        answers: [
            {
                authorLogin: 'user1',
                content: 'Storing tokens in `httpOnly, Secure, SameSite=Strict` cookies protects them from malicious scripts because JavaScript cannot access httpOnly cookies. LocalStorage is vulnerable to XSS.',
                isSolution: true,
                publishDate: '2026-10-30 11:50:00',
                replies: [
                    {
                        authorLogin: 'user6',
                        content: 'Clear and concise, thank you!',
                        publishDate: '2026-10-30 12:15:00'
                    }
                ]
            },
            {
                authorLogin: 'user4',
                content: 'If you use cookies, make sure to implement CSRF protection (such as SameSite flags or anti-CSRF header tokens).',
                isSolution: false,
                publishDate: '2026-10-30 12:30:00',
                replies: []
            }
        ],
        likers: ['user1', 'user2', 'user3', 'user4']
    },
    {
        authorLogin: 'user7',
        categoryTitles: ['CSS & UI Styling'],
        title: 'How to implement responsive CSS layout with modern Flexbox and Grid?',
        content: "I need a card grid that automatically wraps without writing dozens of media queries and adapts smoothly from mobile to desktop screens.",
        status: 'active',
        publishDate: '2026-10-31 15:10:00',
        answers: [
            {
                authorLogin: 'user3',
                content: 'Use CSS Grid with `repeat(auto-fit, minmax(280px, 1fr))`! It automatically calculates columns based on the available container width without any media queries.',
                isSolution: true,
                publishDate: '2026-10-31 15:40:00',
                replies: []
            }
        ],
        likers: ['user1', 'user2', 'user5']
    }
];

const fixtures = seedQuestions.map((q, idx) => ({
    key: `usof-v2-${idx + 1}`,
    login: q.authorLogin,
    email: `${q.authorLogin}@example.com`,
    fullName: `User ${idx + 1}`,
    category: q.categoryTitles[0],
    description: `Discussions related to ${q.categoryTitles[0]}`,
    title: q.title,
    content: q.content,
    comment: q.answers[0]?.content || 'Good question!',
    status: q.status,
    publishDate: q.publishDate,
    commentDate: q.publishDate,
    likeDate: q.publishDate
}));

module.exports = {
    seedUsers,
    standardCategories,
    seedQuestions,
    fixtures,
    TEST_PASSWORD
};
