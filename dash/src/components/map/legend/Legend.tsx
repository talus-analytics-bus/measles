import React from 'react'
import classNames from 'classnames'
import styles from './legend.module.scss'

const Legend = () => {
  const [open, setOpen] = React.useState(true)

  // Color series used to indicate relative vaccination coverage from least to
  // most vaccinated.
  const vaccinationColors = [
    '#d6f0b2',
    '#b9d7a8',
    '#7fcdbb',
    '#41b6c4',
    '#2c7fb8',
    '#303d91'
  ];
  const noDataColor = '#b3b3b3';

  const vaccinationLegendLabels = (i: any) => {
    switch (i) {
      case 0:
        return 'Fewest vaccinated';
      case vaccinationColors.length - 1:
        return 'Most vaccinated';
      default:
        return '';
    }
  };

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
            <p className={styles.sectionName}>Vaccination coverage</p>
            <div className={styles.legendEntryGroups}>
            <div className={styles.legendEntryGroup}>
              {
                vaccinationColors.map((d,i) =>
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
          // Reported cases
          <div className={styles.section}>
            <p className={styles.sectionName}>Reported cases</p>
            {
              [
                'Hello',
                'World',
              ].map(d => <div>{d}</div>)
            }
          </div>
        }
      </div>
    </div>
  )
}
export default Legend
