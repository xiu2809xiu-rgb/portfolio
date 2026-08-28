import type { Project } from './types';

/**
 * Case studies, most significant first.
 *
 * `term` is omitted wherever the dates are not confirmed rather than estimated,
 * and `screenshots` is left empty where no imagery exists yet — both render as
 * absent rather than as a placeholder.
 */
export const projects: readonly Project[] = [
  {
    slug: 'smartrecap',
    index: '01',
    title: 'SmartRecap',
    titleAccent: 'Cited Class Recaps',
    role: 'Frontend — built the entire client',
    module: 'NYP × AWS Hackathon 2026 · Problem Statement 1',
    award: '1st Place',
    team: 'Team Stay Grounded — with Rihan Iqbal, Hong Yi Tan, Dillon Poh',
    status: 'completed',
    featured: true,
    summary:
      'Turns lecture slides, PDFs and Word documents into a structured recap and revision quiz where every claim cites the exact slide it came from.',
    features: [
      '📎 Slides, PDF & DOCX intake',
      '🔗 Slide-level citations',
      '🧪 Generated revision quiz',
      '🧭 3D pipeline guide',
      '🐍 In-browser Python IDE',
      '⏲️ Idle session timeout',
      '📄 25 page components',
      '🚫 Drops untraceable claims',
    ],
    stack: ['React', 'TypeScript', 'WebGL', 'Python', 'AWS', 'Vercel', 'Render'],
    preview: '/video/work/smartrecap.mp4',
    /* Captured from the live demo — see scripts/capture-smartrecap.mjs. */
    screenshots: [
      { src: '/img/work/smartrecap/landing.jpg', title: 'Landing', url: 'smartrecap.vercel.app' },
      { src: '/img/work/smartrecap/grounding.jpg', title: 'Citation reader', url: 'smartrecap.vercel.app/#grounding' },
      { src: '/img/work/smartrecap/features.jpg', title: 'Revision features', url: 'smartrecap.vercel.app/#features' },
      { src: '/img/work/smartrecap/app.jpg', title: 'Sign in', url: 'smartrecap.vercel.app/app' },
    ],
    story: [
      {
        shot: 0,
        label: 'The problem',
        heading: 'A summary you still have to fact-check is not a summary',
        body:
          'Ask a model to summarise a lecture deck and you get fluent paragraphs with no way to tell which slide any sentence came from — so you re-read the deck anyway. The brief was an automated class recap generator; the interesting constraint was making the output trustworthy enough to replace the deck rather than sit alongside it.',
      },
      {
        shot: 1,
        label: 'The rule',
        heading: 'Every claim cites its slide, or it is dropped',
        body:
          'Each line of the recap links back to the exact slide it was drawn from, and anything the model cannot trace to a source is dropped before it reaches you rather than quietly presented as fact. The result says less than a plain summariser would — and nothing it says needs checking against the deck. The landing page puts the target plainly: uncited claims that ship, zero.',
      },
      {
        shot: 1,
        label: 'The reader',
        heading: 'Citations you can follow without losing your place',
        body:
          'I built the reader that connects each recap line to its source slide, so verifying a claim is one click rather than a hunt through the original file. The citation is the primary interaction, not a footnote.',
      },
      {
        shot: 3,
        label: 'Making it legible',
        heading: 'A 3D guide driven by the real pipeline',
        body:
          'Document processing is slow and invisible, which reads as broken. I built a WebGL guide whose stages are wired to the actual backend pipeline, so what is on screen reflects where the job really is instead of animating a guess.',
      },
      {
        shot: 2,
        label: 'Practising',
        heading: 'A Python IDE in the browser',
        body:
          'Recaps and quizzes tell you what you missed; they do not give you anywhere to practise. The client embeds a Python editor so a revision question can be answered by writing code rather than picking an option.',
      },
      {
        shot: 0,
        label: 'The constraint',
        heading: 'One night, not two days',
        body:
          'We misread the schedule and found we had a single sitting rather than two days — 2pm Tuesday to 6:30am Wednesday. Twenty-five page components, the citation reader, the 3D guide and session handling were built in that window. It placed first.',
      },
    ],
    caseStudy: [
      {
        label: 'Situation & Task',
        body: 'Problem Statement 1 of the NYP × AWS Hackathon 2026 asked for an automated class recap generator. The obvious build — feed the deck to a model, print the summary — produces something students still have to verify line by line against the original, which removes most of the value. Our team took the harder read of the brief: the output had to be trustworthy on its own.',
      },
      {
        label: 'Actions Taken',
        body: 'I owned the frontend in full: 25 page components, the citation reader linking each recap line to its source slide, a 3D WebGL guide driven by real backend pipeline stages rather than a canned animation, an in-browser Python practice IDE, and session management with automatic logout after an hour idle. We had one overnight sitting rather than the two days we thought we had — 2pm Tuesday to 6:30am Wednesday.',
      },
      {
        label: 'Results Achieved',
        body: 'First place. The grounding rule — cite the slide or drop the claim — is what separated it from a summariser, and it is the decision I would defend hardest: it makes the tool say less, and makes everything it does say checkable in one click.',
      },
    ],
    metrics: [
      { value: 1, label: 'Place, NYP × AWS 2026' },
      { value: 25, label: 'Page components' },
      { value: '16.5h', label: 'Build window' },
      { value: 4, label: 'Team members' },
    ],
    learnings: [
      'Grounding output in citations is a product decision before it is a technical one — it changes what the tool is allowed to say.',
      'Showing real pipeline stages beats a spinner: an honest wait feels shorter than an invisible one.',
      'Scoping under a hard deadline means choosing what not to build, then building the rest properly.',
      'Owning an entire frontend surface forces consistency decisions you can avoid when splitting the work.',
    ],
    links: [
      { label: 'Live demo', href: 'https://smartrecap.vercel.app', external: true },
      { label: 'View source', href: 'https://github.com/xiu2809xiu-rgb/SmartRecap', external: true },
    ],
    demoNote:
      'The hackathon AWS environment has expired. The live demo runs on Vercel and Render free tiers with a lighter model, and Render sleeps when idle — the first load takes about a minute.',
  },
  {
    slug: 'certain',
    index: '02',
    title: 'CertAIn',
    titleAccent: 'Offline-First Check-In',
    role: 'Hi-fi prototype & usability study',
    module: 'Event check-in and credentialing for an NPO',
    status: 'completed',
    featured: true,
    summary:
      'An event check-in and credentialing system built to keep working when the venue network does not — NFC cards, QR codes and browser-local face recognition.',
    features: [
      '📶 Offline-first by design',
      '💳 Embossed PVC NFC cards',
      '🔳 QR fallback',
      '🙂 On-device face recognition',
      '🔀 Local / cloud engine toggle',
      '🗺️ Venue map',
      '🎫 Event stamps',
      '🧪 9-participant usability study',
    ],
    stack: ['Figma', 'Node.js', 'Azure App Service', 'face-api.js', 'NFC', 'QR'],
    screenshots: [],
    caseStudy: [
      {
        label: 'Situation & Task',
        body: 'Event venues are exactly where connectivity fails — crowded halls, borrowed networks, no guarantee of signal at the door. A check-in system that needs the cloud to admit someone will fail at the worst possible moment. CertAIn was designed offline-first for that reason: NFC cards and QR codes for identification, and face recognition running in the browser rather than on a server.',
      },
      {
        label: 'Actions Taken',
        body: 'I produced the hi-fi prototype in Figma and ran the usability study — moderated think-aloud sessions with nine participants against a "tech-hesitant SME owner" persona, across three scenarios: NFC check-in, the venue map, and event stamps. I also handled the physical side, producing custom embossed PVC NFC cards with print-ready artwork — bleed, outlined text — through an overseas supplier.',
      },
      {
        label: 'Results Achieved',
        body: 'Mean SUS score of 74.2. The finding that mattered most was a failure: a map popup covering the route users needed, which blocked five of the nine participants. None of us had noticed it while building, because we already knew where the route was. Event Stamps was named the favourite feature unprompted by four participants.',
      },
    ],
    metrics: [
      { value: 74.2, label: 'Mean SUS score' },
      { value: 9, label: 'Study participants' },
      { value: 3, label: 'Test scenarios' },
      { value: 5, label: 'Blocked by one popup' },
    ],
    learnings: [
      'Five of nine users blocked by a popup none of the builders could see is the clearest case for testing with strangers I have had.',
      'Designing offline-first changes the architecture, not just the error states — identification has to work with nothing behind it.',
      'A think-aloud protocol surfaces hesitation that a task-completion metric records as success.',
      'Print production has its own constraints — bleed, outlined text, supplier lead times — that a screen prototype never teaches you.',
    ],
    links: [],
  },
  {
    slug: 'singink-support',
    index: '03',
    title: 'Singink',
    titleAccent: 'Support & Ticketing',
    role: 'Lead Developer',
    module: 'IT1x25 Web Development Project',
    term: 'AY2025 Semester 2',
    status: 'completed',
    featured: true,
    summary:
      'The customer support side of the Singink e-commerce platform — ticket intake with validation, threaded replies, file attachments, and an admin dashboard with live analytics.',
    features: [
      '🎫 Ticket CRUD',
      '📊 Admin dashboard',
      '🔍 Status filtering',
      '💬 Reply system',
      '📎 File attachments',
      '🔒 Session auth',
      '📈 Analytics charts',
      '❓ FAQ search',
    ],
    stack: ['Python', 'Flask', 'Jinja2', 'SQLAlchemy', 'MySQL', 'Bootstrap 5', 'JavaScript', 'HTML5/CSS3'],
    preview: '/video/work/singink-support.mp4',
    screenshots: [
      { src: '/img/work/ticketing/support-center.jpg', title: 'Support Center', url: 'singink.com/support' },
      { src: '/img/work/ticketing/create-ticket.jpg', title: 'Create Ticket', url: 'singink.com/support/new' },
      { src: '/img/work/ticketing/my-tickets.jpg', title: 'My Tickets', url: 'singink.com/support/mine' },
      { src: '/img/work/ticketing/ticket-detail.jpg', title: 'Ticket Detail', url: 'singink.com/support/t/1042' },
      { src: '/img/work/ticketing/admin-dashboard.jpg', title: 'Admin Dashboard', url: 'singink.com/admin' },
      { src: '/img/work/ticketing/admin-tickets.jpg', title: 'Admin Tickets', url: 'singink.com/admin/tickets' },
    ],
    story: [
      {
        shot: 0,
        label: 'The problem',
        heading: 'Support was buried in a contact form',
        body:
          'Every question arrived as an unstructured email — no category, no priority, no history. Staff re-asked the same clarifying questions, and users had no way to check whether anyone had picked their issue up. The first job was giving both sides a shared record.',
      },
      {
        shot: 1,
        label: 'Intake',
        heading: 'Validate at the boundary, not after',
        body:
          'The submission form enforces a real subject line, a category, and a priority before anything reaches the database. Rules live server-side too, because the HTML attributes are a courtesy — anyone can post straight to the endpoint. Rejections re-render the form with the input intact.',
      },
      {
        shot: 2,
        label: 'Tracking',
        heading: 'A ticket the user can actually follow',
        body:
          'Once submitted, a ticket has a status the user can see change. That single affordance removed most of the "any update?" follow-ups, because the answer was on screen.',
      },
      {
        shot: 3,
        label: 'The thread',
        heading: 'Replies, attachments, and an audit trail',
        body:
          'Each ticket carries a threaded conversation with file attachments and internal notes staff can add without the user seeing them. The timeline is the audit trail — who changed what, and when.',
      },
      {
        shot: 4,
        label: 'For staff',
        heading: 'A dashboard that answers questions at a glance',
        body:
          'Open counts by status and priority, resolution times, and the queue itself on one screen. Built so the first thing a staff member sees is what needs attention, not a blank filter form.',
      },
      {
        shot: 5,
        label: 'The result',
        heading: 'The intake form did the heavy lifting',
        body:
          'Almost none of the benefit came from the dashboard I was most excited about. It came from the intake form collecting the right information the first time, so tickets arrived actionable instead of needing a round-trip.',
      },
    ],
    caseStudy: [
      {
        label: 'Situation & Task',
        body: 'Singink had high bounce rates and a support load handled entirely by hand. Users could not find assistance efficiently, which produced repeated inquiries and long resolution times. I was tasked with designing and building the ticketing side of the platform to structure issue reporting and response handling.',
      },
      {
        label: 'Actions Taken',
        body: 'Designed and built an OOP-based ticketing module using encapsulation for secure data handling and inheritance for reusable components — ticket submission forms with field validation and error handling, category and priority selection, file upload support, real-time status tracking, an FAQ section with search, and a full admin dashboard with analytics charts, filtering by status and priority, internal notes, and reply functionality. Implemented session-based authentication and role-based access control.',
      },
      {
        label: 'Results Achieved',
        body: 'Structured intake replaced free-text email, so tickets arrived with the category, priority and detail needed to action them without a follow-up question. Status tracking gave users a way to check progress themselves, and the admin dashboard put queue state and resolution times on one screen.',
      },
    ],
    metrics: [
      { value: 4, suffix: '+', label: 'CRUD operations' },
      { value: 12, suffix: '+', label: 'Flask routes' },
      { value: 6, label: 'Database tables' },
      { value: 15, suffix: '+', label: 'Validation rules' },
    ],
    architecture: {
      flow: ['🌐 Browser (HTML/CSS/JS)', '⚙️ Flask + Jinja2', '🛠️ SQLAlchemy ORM', '🗄️ MySQL Database'],
      description:
        'MVC architecture with Flask blueprints for modular routing, Jinja2 templates for server-side rendering, and SQLAlchemy for database abstraction. Bootstrap 5 for responsive UI components.',
    },
    code: {
      filename: 'ticket_routes.py',
      language: 'python',
      source: [
        '# Create ticket with server-side validation',
        "@tickets_bp.route('/create', methods=['GET', 'POST'])",
        'def create_ticket():',
        "    if request.method == 'POST':",
        "        subject = request.form.get('subject', '').strip()",
        "        category = request.form.get('category')",
        '',
        '        if not subject or len(subject) < 5:',
        "            flash('Subject must be at least 5 characters.', 'error')",
        "            return redirect(url_for('tickets.create_ticket'))",
        '',
        '        new_ticket = Ticket(',
        '            subject=subject,',
        '            category=category,',
        "            user_id=session['user_id'],",
        "            status='Open',",
        '        )',
        '        db.session.add(new_ticket)',
        '        db.session.commit()',
        "        return redirect(url_for('tickets.view_ticket', id=new_ticket.id))",
      ].join('\n'),
    },
    video: 'https://www.youtube.com/embed/o2QogoL6NY0',
    learnings: [
      'Implementing CRUD operations with proper input validation and error messages that guide users.',
      'Building role-based access control to separate admin and user functionality.',
      'Designing relational database schemas with foreign keys for data integrity.',
      'Creating responsive dashboards with real-time filtering and analytics.',
      'Handling file uploads securely with Flask and server-side validation.',
    ],
    links: [],
  },
  {
    slug: 'table-tennis-cca-website',
    index: '04',
    title: 'Table Tennis CCA',
    titleAccent: 'Website',
    role: 'Front-End Developer',
    module: 'IT1x15 UX Design in Web Development',
    term: 'AY2025 Semester 1',
    status: 'completed',
    featured: true,
    summary:
      'The club had no home on the web — schedules and results lived in group chats. I designed and built one, from wireframe to deploy.',
    features: [
      '🏠 Hero & landing',
      '🏆 Achievements table',
      '📅 Events calendar',
      '📷 Instagram feed',
      '👥 Member spotlight',
      '📱 Responsive design',
      '🎨 Accordion UI',
      '🔗 Social links',
    ],
    stack: ['HTML5', 'CSS3', 'JavaScript', 'Bootstrap 5', 'Figma', 'Instagram API', 'Google Calendar'],
    preview: '/video/work/table-tennis-cca-website.mp4',
    screenshots: [
      { src: '/img/work/cca/homepage.jpg', title: 'Homepage Hero', url: 'nyp-tabletennis.com' },
      { src: '/img/work/cca/why-join-us.jpg', title: 'Why Join Us', url: 'nyp-tabletennis.com/#why' },
      { src: '/img/work/cca/achievements.jpg', title: 'Achievements & Events', url: 'nyp-tabletennis.com/achievements' },
      { src: '/img/work/cca/club-socials.jpg', title: 'Club Socials & Feed', url: 'nyp-tabletennis.com/socials' },
      { src: '/img/work/cca/members.jpg', title: 'Member Spotlight', url: 'nyp-tabletennis.com/members' },
    ],
    story: [
      {
        shot: 0,
        label: 'The problem',
        heading: 'The club lived in a group chat',
        body:
          'Training times, results, and recruitment notices were scattered across chat history. New students had nowhere to look, and the committee re-posted the same information every semester. The site had to be the one place that answered those questions.',
      },
      {
        shot: 1,
        label: 'Recruitment',
        heading: 'Answer "why should I join?" first',
        body:
          'The section a prospective member reaches first is the one that has to earn their attention. Benefits, training commitment, and skill level are stated plainly rather than buried under club history.',
      },
      {
        shot: 2,
        label: 'Credibility',
        heading: 'Results, sortable and current',
        body:
          'An achievements table with sorting, alongside an events calendar. Competition results are the club’s strongest recruiting argument, so they get a section rather than a footnote.',
      },
      {
        shot: 3,
        label: 'Staying current',
        heading: 'Let the feed do the updating',
        body:
          'The club already posted to Instagram constantly, so the site embeds that feed rather than asking the committee to maintain a second stream. The page stays current without anyone remembering to update it.',
      },
      {
        shot: 4,
        label: 'The people',
        heading: 'Members, not stock photography',
        body:
          'A spotlight section with real members and their own words. It was the part the committee cared most about, and the part that makes the site feel like a club rather than a brochure.',
      },
    ],
    caseStudy: [
      {
        label: 'Situation & Task',
        body: 'The Table Tennis CCA lacked an official online presence, limiting outreach and engagement with students. With no centralised platform for event schedules, achievements, or recruitment, information was scattered across group chats. I was tasked with building a responsive website from scratch to establish their digital platform.',
      },
      {
        label: 'Actions Taken',
        body: 'Designed and built the full CCA website from scratch — hero section with image carousel, achievements table with sorting, events calendar, Instagram feed integration via embed, member spotlight with testimonials, contact information with accordion UI, and social media links. Applied responsive design principles throughout for mobile compatibility.',
      },
      {
        label: 'Results Achieved',
        body: 'Provided the CCA with a centralised digital platform that consolidated all club information in one place. Improved visibility of activities and achievements, enhanced student engagement through a modern, user-friendly design, and established a scalable template that other CCAs could adopt.',
      },
    ],
    metrics: [
      { value: 7, label: 'Page sections' },
      { value: 5, suffix: '+', label: 'UI components' },
      { value: '✓', label: 'Fully responsive' },
      { value: 3, label: 'API integrations' },
    ],
    architecture: {
      flow: ['🎨 Figma Wireframes', '🌐 HTML5 / CSS3 / JS', '📐 Bootstrap 5 Grid', '📱 Responsive Deploy'],
      description:
        'Static front-end built with semantic HTML5, CSS3 animations, and the Bootstrap 5 grid. Third-party embeds handle the Instagram feed and Google Calendar.',
    },
    code: {
      filename: 'carousel.js',
      language: 'javascript',
      source: [
        '// Dynamic image carousel with auto-advance',
        'const initCarousel = (container, interval = 4000) => {',
        "  const slides = container.querySelectorAll('.slide');",
        '  let current = 0;',
        '',
        '  const showSlide = (index) => {',
        '    slides.forEach((slide, i) => {',
        "      slide.classList.toggle('active', i === index);",
        '      slide.style.opacity = i === index ? 1 : 0;',
        '    });',
        '  };',
        '',
        '  setInterval(() => {',
        '    current = (current + 1) % slides.length;',
        '    showSlide(current);',
        '  }, interval);',
        '};',
      ].join('\n'),
    },
    video: 'https://www.youtube.com/embed/5famyxXy_qg',
    learnings: [
      'Building a complete website from wireframe to deployment with HTML5, CSS3, and JavaScript.',
      'Implementing responsive design with the Bootstrap grid for a mobile-first approach.',
      'Integrating third-party APIs and embeds (Instagram, Google Calendar).',
      'Applying UX principles — visual hierarchy, whitespace, and user flow optimisation.',
      'Creating reusable UI components like carousels, accordions, and tabbed navigation.',
      'Gathering stakeholder requirements and iterating on CCA member feedback.',
    ],
    links: [],
  },
  {
    slug: 'swaplah',
    index: '05',
    title: 'SwapLah',
    titleAccent: 'Student Co-op Marketplace',
    role: 'User management',
    module: 'Agile Development Process with DevOps',
    status: 'completed',
    summary:
      'A student co-op marketplace built under an Agile and DevOps module and run through GitLab. I owned user management end to end.',
    features: [
      '🔐 Registration & login',
      '👤 Profile management',
      '⏲️ Session timeout',
      '🚧 Access restriction',
      '🔑 Werkzeug password hashing',
      '📋 GitLab Epic & user stories',
      '🔁 CI/CD documentation',
      '🧾 Test plan & definition of done',
    ],
    stack: ['Python', 'Flask', 'SQLite', 'Werkzeug', 'GitLab CI/CD'],
    screenshots: [],
    caseStudy: [
      {
        label: 'Situation & Task',
        body: 'A student co-operative marketplace, built by a team working the Agile Development Process with DevOps module through GitLab. My slice was user management: everything between a stranger arriving and an authenticated member with a profile and a session that expires.',
      },
      {
        label: 'Actions Taken',
        body: 'Built registration, login and logout, profile management, session timeout and access restriction as a Flask Blueprint, using werkzeug for password hashing and raw sqlite3 rather than an ORM. The work was specified up front as a GitLab Epic broken into five user stories with Given-When-Then acceptance criteria, so "done" was defined before any of it was written. I also wrote the team\'s CI/CD pipeline documentation, test plan, definition of done, and security documentation.',
      },
      {
        label: 'Results Achieved',
        body: 'Given-When-Then criteria turned out to be the useful part: writing the acceptance conditions before the code meant the session-timeout and access-restriction cases were specified rather than discovered, and the test plan wrote itself from the stories.',
      },
    ],
    metrics: [
      { value: 5, label: 'User stories' },
      { value: 1, label: 'GitLab Epic' },
      { value: 4, label: 'Docs authored' },
      { value: '✓', label: 'GWT acceptance criteria' },
    ],
    learnings: [
      'Given-When-Then acceptance criteria written before the code turn "done" from an opinion into a checklist.',
      'Password hashing and session expiry are the parts of auth that are easy to skip and expensive to retrofit.',
      'Raw sqlite3 rather than an ORM makes the SQL visible, which is a fair trade on a small schema.',
      'Writing the CI/CD and security documentation forced me to understand the pipeline rather than just use it.',
    ],
    links: [],
  },
];

export const getProject = (slug: string): Project | undefined =>
  projects.find((project) => project.slug === slug);

/** Home-page selection. Everything else still has a full page under /work. */
export const featuredProjects = projects.filter((project) => project.featured);
