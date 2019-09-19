import React from 'react'
//import Popup from 'reactjs-popup'

import styles from './geomPopup.module.scss'

// : React.FC
const GeomPopup = ({ popupData }) => {
  console.log(popupData)
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
        </div>
      </div>
    </div>
  )
}

export default GeomPopup
