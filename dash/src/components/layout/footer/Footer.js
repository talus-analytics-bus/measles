import React from 'react'
import styles from './footer.module.scss'
import talus from '../../../assets/images/logo-talus.png';
import Util from '../../misc/Util.js';

const Footer = () => {
  const images = [
    {
      imgSrc: talus,
      url: 'http://talusanalytics.com/',
      alt: 'Talus Analytics, LLC'
    },
  ];

  return (
    <div className={styles.footer}>
    <div className={styles.dataAsOf}>
      {
        'Showing most recent data as of ' + Util.today().toLocaleString('en-US', {
          month: 'short',
          year: 'numeric',
          day: 'numeric',
        })
      }
    </div>
      <div className={styles.links}>
      {
        images.map(d =>
          <a target="_blank" href={d.url} alt={d.alt}>
            <img src={d.imgSrc} />
          </a>
        )
      }
      </div>
    </div>
  )
}

export default Footer
