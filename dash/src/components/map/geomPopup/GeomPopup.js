import React from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import styles from './geomPopup.module.scss'

// : React.FC
const GeomPopup = ({ popupData }) => {
  console.log(popupData)
  const detailsPath = '/details/' + popupData['bubble']['place_id']

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <p className={styles.stateName}>
            {popupData['fill']['place_name']}
          </p>
          {
            // <p>
            //   {new Date().toLocaleString('en-us', {
            //     month: 'long',
            //     year: 'numeric',
            //     day: 'numeric'
            //   })}
            // </p>
          }
        </div>
      </div>
      <div>
        <div className={styles.data}>
          {
            [
              {
                slug: 'cases',
                label: 'Measles cases reported',
                value: popupData['bubble']['value'] + ' people', // TODO comma sep int
                delta: popupData['trend']['percent_change'],
                deltaLabel: 'increase from prior 30 days', // TODO inc/dec dynamically
                notAvail: false,
              },
              {
                slug: 'prevalence',
                label: 'Prevalence of measles in population',
                value: 'Data not available', // TODO comma-sep int
                notAvail: true,
              },
              {
                slug: 'vacc-coverage',
                label: 'Vaccination coverage',
                value: parseFloat(popupData['fill']['value']).toFixed(0)+"% of people",
                notAvail: false,
              },
            ].map(d =>
              <div className={classNames(styles[d.slug], styles.datum)}>
                <p className={classNames(styles[d.slug], styles.label)}>{d.label}</p>
                <p className={classNames(
                  styles[d.slug],
                  styles.value,
                  {
                    [styles['notAvail']]: d.notAvail,
                  },
                )}>{d.value}</p>
              </div>
            )
          }
        </div>
        <div className={styles.buttons}>
          <Link to={detailsPath}>
            <button>View country</button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default GeomPopup
