import React from 'react'
import { Link } from 'react-router-dom'
import styles from './logo.module.scss'
import logo from '../../../assets/images/measles_tracker.svg'

const Alert: React.FC = () => {
  return (
    <div className={styles.logo}>
      <Link to="/landing">
        <img src={logo} className={styles.img} alt='logo' />
      </Link>
      <div className={styles.text}>
        <div className={styles.title}>Vaccination coverage and incidence of measles</div>
        {
          <div className={styles.subtitle}>Showing most recent data as of July 2019</div>
          // <div className={styles.subtitle}>Data as of July 2019</div>
        }
      </div>
    </div>
  )
}

export default Alert
