// Ported from the existing site; approved copy is unchanged.
import { ArrowUpRight, Github, Linkedin } from 'lucide-react'
import { Button } from './components/ui/button'
import { CalendlyIcon } from './components/calendly-icon'
import type { Profile } from './types'
export function SocialLinks({ calendly = false, profile }: { calendly?: boolean; profile: Profile }) { return <div className="social-links"><a href={profile.github} target="_blank" rel="noreferrer"><Github size={15} />GitHub <ArrowUpRight size={12} /></a><a href={profile.linkedin} target="_blank" rel="noreferrer"><Linkedin size={15} />LinkedIn <ArrowUpRight size={12} /></a>{calendly && <a href={profile.calendly} target="_blank" rel="noreferrer" aria-label="Book a call on Calendly"><CalendlyIcon size={18} />Calendly <ArrowUpRight size={12} /></a>}</div> }
export function CalendlyLink({ url }: { url: string }) {
  return <Button asChild variant="outline"><a href={url} target="_blank" rel="noreferrer" aria-label="Talk to me directly on Calendly"><CalendlyIcon size={18} />Talk to me directly! <ArrowUpRight size={16} /></a></Button>
}
