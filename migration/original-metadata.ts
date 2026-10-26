import type { Metadata } from 'next'

const pages = {
  home: { title: 'Freelance Full-Stack Developer | Shibly Mohammad Noman', description: 'Work directly with Shibly, a freelance full-stack developer, to build web applications, integrate AI, or improve existing software.' },
  about: { title: 'About Shibly Mohammad Noman | Software Engineer', description: 'Meet Shibly Mohammad Noman, an independent software engineer based in Bangladesh building applications and AI systems.' },
  contact: { title: 'Contact Shibly Mohammad Noman | Software Engineer', description: 'Discuss a new idea, an existing application, or a problem your team wants to solve with Shibly Mohammad Noman.' },
  blog: { title: 'Blog | Shibly Noman — Software & MVP Guides', description: 'Practical guides from Shibly Noman on hiring a developer, planning an MVP, prioritizing features, and understanding development costs.' },
  calculator: { title: 'MVP Cost Calculator | First-Release Budget | Shibly Noman', description: 'Plan your first MVP, compare build costs, and add running costs using your own figures. See what’s included and what you still need to check.' },
}
export function pageMetadata(key: keyof typeof pages): Metadata { return pages[key] }
