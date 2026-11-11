import { Cable, Cpu, Database, Files, PanelsTopLeft, Workflow, type LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'
import styles from './integration-diagram.module.css'

const connections: { label: string; icon: LucideIcon; y: number; color: string; path: string }[] = [
  { label: 'APIs', icon: Cable, y: 14, color: '#339cff', path: 'M 16,14 H 31 C 47,14 38,50 56,50 H 71.5' },
  { label: 'Documents', icon: Files, y: 38, color: '#339cff', path: 'M 16,38 H 35 C 46,38 44,50 56,50 H 71.5' },
  { label: 'Database', icon: Database, y: 62, color: '#339cff', path: 'M 16,62 H 35 C 46,62 44,50 56,50 H 71.5' },
  { label: 'AI Model', icon: Cpu, y: 86, color: '#924ff7', path: 'M 71.5,50 H 56 C 38,50 47,86 31,86 H 16' },
]

export function IntegrationDiagram() {
  return <div className={styles.diagram} role="img" aria-label="A business solution contains an app interface and AI feature backend. The backend connects to APIs, documents, a database, and an AI model.">
    <svg className={styles.paths} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <rect className={styles.boundary} x="44" y="3" width="55" height="94" rx="2" ry="4" />
      {connections.map((connection, index) => <g key={connection.label} style={{ '--beam': connection.color, '--delay': `${0.65 + index * 0.1}s` } as CSSProperties}>
        <path className={styles.track} d={connection.path} pathLength="100" />
        <path className={styles.pulse} d={connection.path} pathLength="100" />
      </g>)}
      <g style={{ '--beam': '#00a240', '--delay': '0s' } as CSSProperties}>
        <path className={styles.track} d="M 71.5,26 V 50" pathLength="100" />
        <path className={styles.pulse} d="M 71.5,26 V 50" pathLength="100" />
      </g>
    </svg>
    {connections.map(({ label, icon: Icon, y, color }) => <span key={label} className={styles.node} style={{ '--x': '16%', '--y': `${y}%`, '--beam': color } as CSSProperties}>
      <Icon aria-hidden="true" />{label}
    </span>)}
    <div className={styles.solution}>
      <span className={styles.solutionLabel}>Business Solution</span>
      <span className={styles.node} style={{ '--x': '50%', '--y': '26%', '--beam': '#00a240' } as CSSProperties}><PanelsTopLeft aria-hidden="true" />App Interface</span>
      <span className={`${styles.node} ${styles.backend}`} style={{ '--x': '50%', '--y': '50%', '--beam': '#0b57d0' } as CSSProperties}><Workflow aria-hidden="true" />AI Feature Backend</span>
    </div>
  </div>
}
