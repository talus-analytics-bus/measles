import React from 'react'
import Popup from 'reactjs-popup'
import styles from './drawer.module.scss'

import Alerts from '../../alerts/Alerts.js'
import Chart from '../../chart/Chart.js'

// If DEMO_DATE exists, use it (frames all data in site relative to the demo
// date that is specified). Otherwise, today's date will be used ("now").
var DEMO_DATE = process.env.DEMO_DATE
if (typeof DEMO_DATE === 'undefined') {
  DEMO_DATE = '2025-07-04T23:56:00'
}
const now = DEMO_DATE !== undefined ? new Date(DEMO_DATE) : new Date();

//: React.FC
const Drawer = ({ facilities, mappedFacilityTypes }) => {

  // split facilities by severity
  const stableFacilities = []
  const alertedFacilities = []
  const criticalFacilities = []
  facilities.forEach(e => {

    // Only include facility types that are enabled (in the Options menu of the
    // map) for tabulation in this bar chart.
    if (!mappedFacilityTypes.includes(e.type)) return;
    switch (e.severity) {
      case 'stable':
        stableFacilities.push(e)
        break
      case 'alerted':
        alertedFacilities.push(e)
        break
      case 'critical':
        criticalFacilities.push(e)
        break
      default:
        break
    }
  })

  return (
    <div className={styles.drawer}>
      <div className={styles.titleContainer}>
        <p className={styles.title}>Emergency power threat conditions</p>
        <p className={styles.date}>
          {now.toLocaleString('en-us', {
            month: 'long',
            year: 'numeric',
            day: 'numeric'
          })}
        </p>
      </div>
      <div className={styles.alertsContainer}>
        <p className={styles.subtitle}>
          National alerts

          <Popup
            trigger={open => (
              <i className='material-icons-outlined'>info</i>
            )}
            position="top center"
            on="hover"
            closeOnDocumentClick
          >
            <div className={"infoTooltip"}>
              <span>Includes all currently active alerts nationwide.</span>
            </div>
          </Popup>

        </p>
        <Alerts
          stableCount={stableFacilities.length}
          alertedCount={alertedFacilities.length}
          criticalCount={criticalFacilities.length}
        />
      </div>
      <div>
        <p className={styles.subtitle}>States with alerts</p>
        <Chart
          stableFacilities={stableFacilities}
          alertedFacilities={alertedFacilities}
          criticalFacilities={criticalFacilities}
        />
      </div>
    </div>
  )
}

export default Drawer
