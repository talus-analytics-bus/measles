import React from 'react'
import { Link } from 'react-router-dom'
import styles from './logo.module.scss'
import logo from '../../../assets/images/measles_tracker.svg'
import iconPin from '../../../assets/images/pin.svg'
import iconFlag from '../../../assets/images/flag.svg'
import iconGlobe from '../../../assets/images/globe.svg'

const Alert: React.FC = () => {
  return (
    <div className={styles.logo}>
      <Link to="/map">
        <img src={logo} className={styles.img} alt='logo' />
      </Link>
      <div className={styles.text}>
        <div className={styles.title}>Vaccination coverage and incidence of measles</div>
        {
          <div className={styles.subtitle}>Showing most recent data as of September 2019</div>
          // <div className={styles.subtitle}>Showing data released September 2019</adiv>
        }
      </div>
      <div className={styles.navButtons}>
        {
          [
            {
              id: 'pin',
              route: '/map', // TODO rename
              icon: iconPin,
              tooltip: 'Click to view map of vaccination coverage and incidence of measles',
            },
            {
              id: 'flag',
              route: '/detail', // TODO rename
              icon: iconFlag,
              tooltip: 'Click to view map of vaccination coverage and incidence of measles',
            },

            {
              id: 'globe',
              route: '/global', // TODO rename
              icon: iconGlobe,
              tooltip: 'Click to view map of vaccination coverage and incidence of measles',
            },
          ].map(button =>
              button.route && (
                <Link to={button.route}>
                  <div>
                    <img src={button.icon} />
                  </div>
                </Link>
              )
          )
        }
      </div>
    </div>
  )
}

export default Alert
