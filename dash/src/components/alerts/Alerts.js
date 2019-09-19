import React from 'react'
import styles from './alerts.module.scss'

const testData = [
  {
    status: 'critical',
    alerts: 14,
    oldAlerts: 11
  },
  {
    status: 'alerted',
    alerts: 6,
    oldAlerts: 7
  },
  {
    status: 'stable',
    alerts: 8,
    oldAlerts: 13
  }
]

// interface Props {
//   stableCount: number
//   alertedCount: number
//   criticalCount: number
// }
//: React.FC<Props>
const Alerts = ({ stableCount, alertedCount, criticalCount }) => {
  return (
    <div className={styles.grid}>
      {Array(
        ['stable', stableCount, 0],
        ['alerted', alertedCount, 0],
        ['critical', criticalCount, 0]
      ).map(([status, alerts, oldAlerts]) => (
        <div className={styles.alert}>
          <div className={styles[status]}>{status.toUpperCase()}</div>
          <p>
            <span>{alerts}</span>&nbsp;ALERTS
          </p>
          <p>
            {`${Math.abs(alerts - oldAlerts)} alerts ${
              oldAlerts < alerts ? 'more' : 'less'
            } than last week`}
          </p>
        </div>
      ))}
    </div>
  )
}

export default Alerts
