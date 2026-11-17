// The site's pages, in order. `id` is the URL (/scoreplus/) and the file in src/pages/.
// `name`, `role` and `year` appear in the work index on the home page; `work: true` puts a page there.
// `title`, `sub` and `stripe` are written on the page's VHS tape in the 3D shelf (Making Of).
// `description` is the page's search and link-preview summary.
export const TAPES = [
  { id: 'about', name: 'About', title: 'ABOUT ME', sub: 'Nash Carroll', stripe: '#e5484d',
    description: 'Nash Carroll is a computer science grad student at the University of Georgia who builds real-time web apps and 3D/XR tools.' },
  { id: 'scoreplus', name: 'ScorePlus', work: true, role: 'Sole developer, Lynx System Developers', year: '2024',
    summary: 'Browser control panel for LED stadium displays. Shipped to clients.',
    title: 'SCOREPLUS', sub: 'Live scoreboard', stripe: '#f5a524',
    description: 'ScorePlus: a browser control panel for LED stadium displays, built and shipped by Nash Carroll as sole developer at Lynx System Developers. Includes a playable demo.' },
  { id: 'cinja', name: 'Cinema Ninja', work: true, role: 'Front-end lead, team of five', year: '2026',
    summary: 'Movie ticket booking with a live seat map.',
    title: 'CINEMA NINJA', sub: 'Box office', stripe: '#30a46c',
    description: 'Cinema Ninja: a full-stack movie ticket booking system with a live seat map. Nash Carroll led the front end of the ticket-purchasing flow.' },
  { id: 'xr', name: 'XR Lab', work: true, role: 'Graduate assistant, UGA', year: '2025–',
    summary: 'A digital patient, markerless motion capture, a classroom of headsets.',
    title: 'XR LAB', sub: 'VR for healthcare', stripe: '#d6409f',
    description: "Nash Carroll's XR work at the University of Georgia: a digital-patient module, markerless motion capture, and a classroom fleet of VR headsets." },
  { id: 'resume', name: 'Resume', title: 'RESUME', sub: 'The full tape', stripe: '#8e4ec6',
    description: "Nash Carroll's resume: education, experience, projects and skills. PDF download included." },
  { id: 'contact', name: 'Contact', title: 'CONTACT', sub: 'Email + links', stripe: '#3e8ed0',
    description: 'Get in touch with Nash Carroll: email, LinkedIn, GitHub and resume.' },
  { id: 'making-of', name: 'Making Of', role: 'This site', year: '2026',
    summary: 'How this site is built, and the 3D shelf it started as.',
    title: 'MAKING OF', sub: 'How this site works', stripe: '#12a594',
    description: 'How this portfolio is built: static pages on a Swiss grid, and the three.js entertainment center the site started as.' },
];

export const WORK = TAPES.filter((t) => t.work);
export const tapeById = (id) => TAPES.find((t) => t.id === id);
export const tapeUrl = (id) => `/${id}/`;
