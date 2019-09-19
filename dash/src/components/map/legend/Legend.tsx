import React from 'react'
import classNames from 'classnames'
import styles from './legend.module.scss'

const Legend = () => {
  const [open, setOpen] = React.useState(false)

  return (
    <div
      className={classNames(styles.mapOverlay, styles.legend, {
        [styles.open]: open
      })}
    >
      <div className={styles.toggleButton} onClick={() => setOpen(!open)}>
        <p>Legend</p>
        <i
          className={classNames('material-icons-outlined', {
            [styles.open]: open
          })}
        >
          expand_more
        </i>
      </div>
      <div className={styles.empty} />
      <div className={styles.legendScale}>
        <ul className={styles.legendScale}>
          <li><span style={{background: '#F1EEF6'}}></span>0 - 20%</li>
          <li><span style={{background: '#BDC9E1'}}></span>40%</li>
          <li><span style={{background: '#74A9CF'}}></span>60%</li>
          <li><span style={{background: '#2B8CBE'}}></span>80%</li>
          <li><span style={{background: '#045A8D'}}></span>100%</li>
        </ul>
      </div>
      <div className={styles.contentContainer}>
        <p>Facility types</p>
        {[
        ].map(([label, icon]) => (
          <div>
            <img src={icon} alt={`${label} marker`} />
            <p>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
export default Legend
