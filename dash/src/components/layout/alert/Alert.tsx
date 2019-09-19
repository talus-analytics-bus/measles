import React from 'react'
import styles from './alert.module.scss'

const Alert: React.FC = () => {
  return (
    <div className={styles.alert}>
      <p className={styles.p}>
        <span className={styles.highlight}>ALERT</span> Power PIONEER is
        currently monitoring threats as a result of Hurricane David...
      </p>
    </div>
  )
}

export default Alert
