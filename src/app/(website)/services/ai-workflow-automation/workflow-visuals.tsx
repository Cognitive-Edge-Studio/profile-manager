import { ClipboardCheck, ClipboardList, ContactRound, FileText, Forward, Inbox, Workflow } from 'lucide-react'
import type { CSSProperties } from 'react'
import styles from './workflow.module.css'

const workflows = [
  { input: 'Website form', inputIcon: ClipboardList, output: 'Assign lead', outputIcon: ContactRound, tone: 'action' },
  { input: 'Shared inbox', inputIcon: Inbox, output: 'Route email', outputIcon: Forward, tone: 'action' },
  { input: 'Invoice upload', inputIcon: FileText, output: 'Request approval', outputIcon: ClipboardCheck, tone: 'approval' },
]

export function ConnectedWorkflows() {
  return (
    <div
      className={styles.connectedWorkflows}
      role="img"
      aria-label="Connected workflows. AI reads inputs and business rules route the work. A website form leads to a lead assignment, a shared inbox message is routed, and an uploaded invoice goes for approval."
    >
      <div className={styles.workflowGrid}>
        <div className={styles.workflowEngine}>
          <span className={styles.workflowEngineIcon} aria-hidden="true">
            <Workflow size={17} />
          </span>
          <div>
            <strong>AI reads the input</strong>
            <p>Business rules route the work</p>
          </div>
        </div>
        {workflows.map(({ input, inputIcon: InputIcon, output, outputIcon: OutputIcon, tone }, index) => (
          <div className={styles.workflowLane} key={input} style={{ '--beam-delay': `${index * 0.18}s` } as CSSProperties}>
            <span className={styles.workflowNode}>
              <span className={styles.workflowIcon}><InputIcon size={16} aria-hidden="true" /></span>
              {input}
            </span>
            <span className={styles.workflowArrow} aria-hidden="true" />
            <span className={styles.workflowArrow} data-tone={tone} aria-hidden="true" />
            <span className={styles.workflowNode} data-tone={tone}>
              <span className={styles.workflowIcon}><OutputIcon size={16} aria-hidden="true" /></span>
              {output}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
