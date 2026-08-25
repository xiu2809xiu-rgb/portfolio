import type { Project } from './types';

export const projects: readonly Project[] = [
  {
    slug: 'customer-ticketing-system',
    index: '01',
    title: 'Customer',
    titleAccent: 'Ticketing System',
    role: 'Lead Developer',
    module: 'IT1x25 Web Development Project',
    term: 'AY2025 Semester 2',
    status: 'completed',
    summary:
      'A full support desk built on Flask — ticket intake with validation, threaded replies, file attachments, and an admin dashboard with live analytics.',
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
        heading: 'Roughly 60% less manual handling',
        body:
          'Almost none of that came from the dashboard I was most excited about. It came from the intake form collecting the right information the first time, so tickets arrived actionable instead of needing a round-trip.',
      },
    ],
    caseStudy: [
      {
        label: 'Situation & Task',
        body: 'The project addressed high website bounce rates and excessive customer support workload. Users could not find assistance efficiently, leading to repeated inquiries and long resolution times. I was tasked with designing and implementing a customer ticketing system to streamline issue reporting and response handling.',
      },
      {
        label: 'Actions Taken',
        body: 'Designed and built an OOP-based ticketing module using encapsulation for secure data handling and inheritance for reusable components — ticket submission forms with field validation and error handling, category and priority selection, file upload support, real-time status tracking, an FAQ section with search, and a full admin dashboard with analytics charts, filtering by status and priority, internal notes, and reply functionality. Implemented session-based authentication and role-based access control.',
      },
      {
        label: 'Results Achieved',
        body: 'Reduced reliance on manual customer support handling by roughly 60%, improved issue traceability and response efficiency with average resolution tracking, and contributed to a smoother customer journey — supporting higher user retention and potential conversion improvements. The admin dashboard provided real-time visibility into support metrics.',
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
      'Applying Design Thinking to understand and empathise with end-user needs.',
    ],
    links: [{ label: 'View source', href: 'https://github.com/Richie280907', external: true }],
  },
  {
    slug: 'table-tennis-cca-website',
    index: '02',
    title: 'Table Tennis CCA',
    titleAccent: 'Website',
    role: 'Front-End Developer',
    module: 'IT1x15 UX Design in Web Development',
    term: 'AY2025 Semester 1',
    status: 'completed',
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
    links: [{ label: 'View source', href: 'https://github.com/Richie280907', external: true }],
  },
];

export const getProject = (slug: string): Project | undefined =>
  projects.find((project) => project.slug === slug);
