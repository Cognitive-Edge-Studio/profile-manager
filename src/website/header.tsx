'use client'
// Ported from the existing site; approved copy is unchanged.
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Link, NavLink } from './runtime'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { Button } from './components/ui/button'
import type { Profile, WebsiteLink } from './types'
export function Header({ profile, navigation, action, avatar, preview = false }: { profile: Profile; navigation: WebsiteLink[]; action?: WebsiteLink; avatar?: string; preview?: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => { setOpen(false) }, [pathname])
  const links = <>{navigation.map((link, i) => <NavLink key={i} to={link.href} target={link.target} rel={link.rel}>{link.label}</NavLink>)}</>
  return <div className="site-header-shell"><header className="site-header container"><Link to="/" className="brand" aria-label={`${profile.name} home`}>{avatar && <Image unoptimized={preview} sizes="40px" className="brand-portrait" src={avatar} alt="" width={40} height={40} aria-hidden="true" />}<span>{profile.name}<small>{profile.role}</small></span></Link><nav className="desktop-nav" aria-label="Main navigation">{links}</nav>{action && <Button asChild size="sm" className="header-cta"><Link to={action.href} target={action.target} rel={action.rel}>{action.label} <ArrowUpRight size={15} /></Link></Button>}<Button variant="ghost" size="icon" className="mobile-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-controls="mobile-navigation" aria-expanded={open}>{open ? <X /> : <Menu />}</Button>{open && <nav onClick={() => setOpen(false)} className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">{links}{action && <Button asChild className="mobile-contact"><Link to={action.href} target={action.target} rel={action.rel}>{action.label} <ArrowUpRight size={16} /></Link></Button>}</nav>}</header></div>
}


