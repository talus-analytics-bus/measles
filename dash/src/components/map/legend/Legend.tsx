import React from 'react'
import classNames from 'classnames'
import styles from './legend.module.scss'
import Util from '../../misc/Util.js'

const Legend = (props: any) => {
  const [open, setOpen] = React.useState(true)

  const noDataColor = '#b3b3b3';

  const vaccinationLegendLabels = (i: any) => {
    switch (i) {
      case 0:
        return 'Low coverage';
      case Util.vaccinationColors.length - 1:
        return 'High coverage';
      default:
        return '';
    }
  };

  const legendBubbleLabeling = props.legendBubbleLabeling;

  return (
    <div
      className={classNames(styles.mapOverlay, styles.legend, {
        [styles.open]: open
      })}
    >
      <div className={styles.toggleButton} onClick={() => setOpen(!open)}>
        <i
          className={classNames('material-icons', {
            [styles.open]: open
          })}
        >
          play_arrow
        </i>
      </div>
      <div className={styles.sections}>
        {
          // Vaccination coverage
          <div className={styles.section}>
            <p className={styles.sectionName}>Vaccination coverage (2018)</p>
            <div className={styles.legendEntryGroups}>
              <div className={styles.legendEntryGroup}>
                {
                  Util.vaccinationColors.map((d,i) =>
                    <div className={styles.legendEntry}>
                      <div className={classNames(styles.legendIcon, styles.rect)} style={ {'backgroundColor': d} } />
                      <div className={styles.legendLabel}>{
                        vaccinationLegendLabels(i)
                      }</div>
                    </div>
                  )
                }
              </div>
              <div className={styles.legendEntryGroup}>
                {
                  <div className={classNames(styles.legendEntry, styles.dataNotAvailable)}>
                    <div className={classNames(styles.legendIcon, styles.rect)} style={ {'backgroundColor': noDataColor} } />
                    <div className={styles.legendLabel}>{
                      'Data not available'
                    }</div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
        {
          // Incidence
          <div className={styles.section}>
            <p className={styles.sectionName}>{legendBubbleLabeling.sectionName}</p>
            <div className={styles.legendEntryGroups}>
              <div className={styles.legendEntryGroup}>
                {
                  [1,2,3].map((d,i) =>
                    <div className={classNames(styles.legendEntry, styles.circle)}>
                    <div className={classNames(styles.legendIcon, styles.circle)} />
                      {
                        (i === 0) && <div className={styles.legendLabel}>Low<br/>{legendBubbleLabeling.noun}</div>
                      }
                      {
                        (i === 2) && <div className={styles.legendLabel}>High<br/>{legendBubbleLabeling.noun}</div>
                      }
                    </div>
                  )
                }
              </div>
              <div className={styles.legendEntryGroup}>
                {
                  <div className={classNames(styles.legendEntry, styles.dataNotAvailable)}>
                    <div className={classNames(styles.legendIcon, styles.circle)} />
                    <div className={styles.legendLabel}>
                      Data over 3
                      <br/>
                      months old
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  )
}
export default Legend
