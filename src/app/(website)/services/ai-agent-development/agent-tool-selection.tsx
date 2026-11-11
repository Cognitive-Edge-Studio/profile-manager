import { Bot, ClipboardCheck, CreditCard, Headset, MessageSquare, UserRound } from 'lucide-react'
import styles from './agent.module.css'

const tools = [
  { label: 'Billing', Icon: CreditCard, selected: true },
  { label: 'Account', Icon: UserRound, selected: true },
  { label: 'Support', Icon: Headset, selected: false },
]

export function AgentToolSelection() {
  return (
    <figure
      className={styles.diagram}
      role="img"
      aria-label="A request goes to the AI agent. It chooses Billing and Account from three available tools, then sends its result for human review."
    >
      {tools.map(({ label, Icon, selected }) => (
        <span key={label} className={styles.diagramNode + ' ' + styles.toolNode} data-selected={selected}>
          <span className={styles.diagramIcon}><Icon size={18} aria-hidden="true" /></span>
          {label}
        </span>
      ))}

      <div className={styles.toolConnections} aria-hidden="true">
        <span className={styles.billingBranch} />
        <span className={styles.accountBranch} />
        <span className={styles.supportBranch} />
      </div>

      <span className={styles.diagramNode}>
        <span className={styles.diagramIcon}><MessageSquare size={18} aria-hidden="true" /></span>
        Request
      </span>
      <span className={styles.diagramArrow} aria-hidden="true" />
      <span className={styles.diagramNode + ' ' + styles.agentNode}>
        <span className={styles.diagramIcon}><Bot size={23} aria-hidden="true" /></span>
        AI agent
      </span>
      <span className={styles.diagramArrow} aria-hidden="true" />
      <span className={styles.diagramNode + ' ' + styles.reviewNode}>
        <span className={styles.diagramIcon}><ClipboardCheck size={18} aria-hidden="true" /></span>
        Ready for review
      </span>
    </figure>
  )
}
