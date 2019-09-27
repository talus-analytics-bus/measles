import React from 'react'
import { Link } from 'react-router-dom'

import styles from './geomPopup.module.scss'

// : React.FC
const GeomPopup = ({ popupData }) => {
  console.log(popupData)
  const detailsPath = '/details/' + popupData['bubble']['place_id']

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <p>
            {popupData['fill']['place_name']}
          </p>
          <p>
            {new Date().toLocaleString('en-us', {
              month: 'long',
              year: 'numeric',
              day: 'numeric'
            })}
          </p>

        </div>
      </div>
      <div>
        <div>
          <p>
            Vaccination coverage (1-2 y/o)
          </p>
          <p>
            {parseFloat(popupData['fill']['value']).toFixed(0)+"%"}
          </p>
          <p>
            Measles Cases
          </p>
          <p>
            {popupData['bubble']['value']}
          </p>
          <p>
            Month over month
          </p>
          <p>
            {popupData['trend']['percent_change']}
          </p>
        </div>
        <div className={styles.buttons}>
          <Link to={detailsPath}>
            <button>Country detail</button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default GeomPopup
