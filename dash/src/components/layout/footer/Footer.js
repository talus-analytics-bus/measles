import React from 'react'
import styles from './footer.module.scss'
import talus from '../../../assets/images/logo-talus.png';
import gtown from '../../../assets/images/logo-georgetown.png';

const Footer = () => {
  const images = [
    {
      imgSrc: gtown,
      url: 'https://ghss.georgetown.edu',
      alt: 'Georgetown University Medical Center - Center for Global Health Science and Security',
    },
    {
      imgSrc: talus,
      url: 'http://talusanalytics.com/',
      alt: 'Talus Analytics, LLC'
    },
  ];

  return (
    <div className={styles.footer}>
    {
      images.map(d =>
        <a target="_blank" href={d.url} alt={d.alt}>
          <img src={d.imgSrc} />
        </a>
      )
    }
    </div>
  )
}

export default Footer
