import { ChartNoAxesCombined, Database, Network } from 'lucide-react'
import iconPaths from '../../content/technology-icons.json'

const icons: Record<string, string> = iconPaths

export function TechnologyBadge({ name }: { name: string }) {
  const icon = icons[name]
  const Symbol = name === 'charts' ? ChartNoAxesCombined : name === 'DAG visualization' ? Network : Database

  return (
    <span className="technology-badge">
      {icon
        ? <img src={icon} alt="" aria-hidden="true" width={16} height={16} loading="lazy" decoding="async" />
        : <Symbol size={16} strokeWidth={1.6} aria-hidden="true" />}
      {name}
    </span>
  )
}
