import React from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import Util from '../../misc/Util.js'

import styles from './geomPopup.module.scss'

// : React.FC
const GeomPopup = ({ popupData }) => {
  console.log(popupData)



  const detailsPath = '/details/' + popupData['place_id'];
  const flag = `/flags/${popupData['place_iso']}.png`;

  // const flagTest = new File(`/flags/${popupData['place_iso']}.png`)
  // console.log('flagTest')
  // console.log(flagTest)

  const getTooltipMetricData = (popupData, type) => {
    const obs = popupData[type];
    switch (type) {
      case 'incidence':
        if (obs === undefined) return {
          notAvail: true,
          label: 'Incidence of measles',
        }
        else return {
          slug: type,
          label: 'Incidence of measles',
          dateFmt: Util.getDatetimeStamp(obs, 'month'),
          value: Util.formatIncidence(obs['value']),
          unit: 'cases per 1M population',
          valueNum: obs['value'],
          notAvail: obs['value'] === null,
          dataSource: obs['data_source'],
          dataSourceLastUpdated: new Date (obs['updated_at']),
        }
      case 'bubble':
        if (obs === undefined) return {
          notAvail: true,
          label: 'Measeles cases reported',
          dateFmt: '',
        }
        else return {
          slug: 'cases',
          label: 'Measles cases reported',
          dateFmt: Util.getDatetimeStamp(obs, 'month'),
          value: Util.comma(obs['value']),
          unit: Util.getPeopleNoun(obs['value']),
          deltaData: Util.getDeltaData(popupData['trend']),
          notAvail: obs['value'] === null,
          dataSource: obs['data_source'],
          dataSourceLastUpdated: new Date (obs['updated_at']),
        };
      case 'fill':
        if (obs === undefined) return {
          notAvail: true,
          label: 'Vaccination coverage',
          dateFmt: '',
        }
        else return {
          slug: 'vacc-coverage',
          label: 'Vaccination coverage',
          dateFmt: Util.getDatetimeStamp(obs, 'year'),
          value: parseFloat(obs['value']).toFixed(0) + '%',
          unit: "of infants",
          dataSource: obs['data_source'],
          dataSourceLastUpdated: new Date (obs['updated_at']),
          notAvail: false, // TODO dynamically
        };
      default:
        console.log('[Error] Unknown metric type: ' + type);
        return {};
    }
  };

  // // Hide image if not found
  // const hideImage = (e) => {
  //   e.target.src = null;
  // };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <p className={styles.stateName}>
            {flag && popupData['fill'] !== undefined && <img src={flag} />}
            {popupData['fill'] ? popupData['fill']['place_name'] : popupData['place_name']}
          </p>
        </div>
      </div>
      <div>
        <div className={styles.data}>
          {
            [
              getTooltipMetricData(popupData, 'incidence'),
              getTooltipMetricData(popupData, 'bubble'),
              getTooltipMetricData(popupData, 'fill'),
            ].map(d =>
              <div className={classNames(
                styles[d.slug],
                styles.datum
              )}>
                <p className={classNames(styles[d.slug], styles.label)}>
                  {d.label}
                  <br/>
                  {d.dateFmt && `(${d.dateFmt})`}
                </p>
                <p className={classNames(
                  styles[d.slug],
                  styles.content,
                  {
                    [styles['notAvail']]: d.notAvail,
                    [styles.zero]: d.valueNum && d.valueNum === 0,
                  },
                )}>
                  <div className={styles.value}>
                  {d.notAvail ? 'Recent data not available' : d.value}
                  </div>
                  {
                    d.notAvail ? '' : <div className={styles.unit}>{d.unit}</div>
                  }
                  {
                    // If value2 exists, add that
                    (d.value2 !== undefined) && <span className={styles.value2}>{d.value2}</span>
                  }
                  {
                      // If delta exists, add that
                      (d.deltaData && d.deltaData.delta !== undefined) && !d.notAvail && <div className={classNames(styles.delta, {
                        [styles['inc']]: d.deltaData.delta > 0,
                        [styles['dec']]: d.deltaData.delta < 0,
                        [styles['same']]: d.deltaData.delta === 0,
                      })}>
                        <i className={classNames('material-icons')}>play_arrow</i>
                        <span className={styles['delta-value']}>
                          {
                            // Don't include sign for now since it's redundant
                            // <span className={styles['sign']}>{d.deltaSign}</span>
                          }
                          <span className={styles['num']}>{d.deltaData.deltaFmt}</span>
                        </span>
                        <span className={styles['delta-text']}>{Util.getDeltaWord(d.deltaData.delta)} from<br/>previous month</span>
                      </div>
                    }
                </p>
                {
                  (d.dataSource && !d.notAvail) &&
                    <div className={classNames('dataSource', styles.dataSource)}>
                      Source: {d.dataSource}{ d.dataSourceLastUpdated && ( // TODO remove "false" when this field is ready
                          ' as of ' + new Date(d.dataSourceLastUpdated).toLocaleString('en-us', { // TODO correctly
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'UTC',
                          })
                        )
                      }
                    </div>
                }
              </div>
            )
          }
        </div>
        <div className={styles.buttons}>
          <Link to={detailsPath}>
            <button>View country</button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default GeomPopup
