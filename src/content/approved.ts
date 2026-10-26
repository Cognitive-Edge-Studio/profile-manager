import content from './approved.json'

export default content
export type Section = { title: string; body: string }

export function splitSections(text: string, level = 3): { intro: string; items: Section[] } {
  const parts = text.split(new RegExp(`^${'#'.repeat(level)} `, 'm'))
  const intro = parts.shift()?.trim() || ''
  return { intro, items: parts.map(part => {
    const index = part.indexOf('\n')
    return { title: index === -1 ? part.trim() : part.slice(0, index).trim(), body: index === -1 ? '' : part.slice(index + 1).trim() }
  }) }
}

export function beforeAction(text: string) { return text.split(/^\*\*[^\n]+\*\* →/m)[0].trim() }
export function paragraphs(text: string) { return text.trim().split(/\n\s*\n/).filter(Boolean) }

export const profile = {
  name: 'Shibly Mohammad Noman',
  role: 'Freelance full-stack developer',
  email: 'shibly.work@gmail.com',
  linkedin: 'https://www.linkedin.com/in/shibly-mohammad/',
  github: 'https://github.com/Shibly-Noman',
  calendly: 'https://calendly.com/shiblynoman/talk-to-shibly',
}
