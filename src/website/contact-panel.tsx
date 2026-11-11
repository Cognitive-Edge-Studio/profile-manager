'use client'

import { useState } from 'react'
import { ArrowUpRight, Mail } from 'lucide-react'
import { CalendlyLink } from './contact-links'
import { Button } from './components/ui/button'
import { useWebsiteRuntime } from './runtime'

export function ContactPanel({ home = false, heading = 'Discuss your project' }: { home?: boolean; heading?: string }) {
  const { profile, summary } = useWebsiteRuntime()
  const [message, setMessage] = useState('')

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary)
      setMessage('Copied. Paste your summary into your email.')
    } catch {
      setMessage('Select and copy your summary from the text box.')
    }
  }

  return <>
    <h2>{heading}</h2>
    <p>Tell me what you’re building, what you need help with, and when you’d like to start.</p>
    {!home && summary && <div className="calculator-inquiry-note">
      <label htmlFor="contact-calculator-summary">Your calculator summary</label>
      <textarea id="contact-calculator-summary" value={summary} readOnly rows={6} />
      <Button variant="outline" onClick={copySummary}>Copy summary</Button>
      {message && <p role="status">{message}</p>}
    </div>}
    <div className="hero-actions inquiry-actions">
      <Button asChild><a href={`mailto:${profile.email}`}><Mail size={16} />Email me <ArrowUpRight size={16} /></a></Button>
      {profile.calendly && <CalendlyLink url={profile.calendly} />}
    </div>
  </>
}
