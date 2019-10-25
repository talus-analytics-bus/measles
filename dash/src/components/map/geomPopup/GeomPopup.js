import React from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import Util from '../../misc/Util.js'

import styles from './geomPopup.module.scss'

// : React.FC
const GeomPopup = ({ popupData }) => {
  console.log(popupData)

  /**
   * Return + if delta > 0, - if less, none otherwise.
   * @method getDeltaSign
   * @param  {[type]}     deltaVal [description]
   * @return {[type]}              [description]
   */
  const getDeltaSign = (deltaVal) => {
    if (deltaVal > 0) {
      return '+';
    } else if (deltaVal < 0) {
      return '-';
    } else {
      return '';
    }
  };

  const getDeltaWord = (deltaVal) => {
    if (deltaVal > 0) {
      return 'increase';
    } else if (deltaVal < 0) {
      return 'decrease';
    } else {
      return 'No change';
    }
  };

  const getPeopleNoun = (val) => {
    if (val === 1) return 'person';
    else return 'people';
  };

  const getDeltaData = (datum) => {
    if (datum && datum['percent_change'] !== null) {
      return {
        delta: datum['percent_change'],
        deltaSign: getDeltaSign(datum['percent_change']),
        deltaFmt: Util.percentizeDelta(datum['percent_change']),
      }
    } else return {};
  };

  const detailsPath = '/details/' + popupData['place_id'];
  const flag = `/flags/${popupData['place_iso']}.png`;

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
          label: 'Incidence of measles' + ` (${Util.getDatetimeStamp(obs, 'month')})`,
          value: Util.formatIncidence(obs['value']) + ' cases per 1M population',
          valueNum: obs['value'],
          // value2: Util.getIncidenceQuantile(obs, {type: 'name'}),
          notAvail: obs['value'] === null,
          dataSource: obs['data_source'],
          dataSourceLastUpdated: new Date (obs['updated_at']),
        }
      case 'bubble':
        if (obs === undefined) return {
          notAvail: true,
          label: 'Measeles cases reported',
        }
        else return {
          slug: 'cases',
          label: 'Measles cases reported' + ` (${Util.getDatetimeStamp(obs, 'month')})`,
          value: Util.comma(obs['value']) + ' ' + getPeopleNoun(obs['value']),
          deltaData: getDeltaData(popupData['trend']),
          notAvail: obs['value'] === null,
          dataSource: obs['data_source'],
          dataSourceLastUpdated: new Date (obs['updated_at']),
        };
      case 'fill':
        if (obs === undefined) return {
          notAvail: true,
          label: 'Vaccination coverage',
        }
        else return {
          slug: 'vacc-coverage',
          label: 'Vaccination coverage' + ` (${Util.getDatetimeStamp(obs, 'year')})`,
          value: parseFloat(obs['value']).toFixed(0)+"% of infants",
          dataSource: obs['data_source'],
          dataSourceLastUpdated: new Date (obs['updated_at']),
          notAvail: false, // TODO dynamically
        };
      default:
        console.log('[Error] Unknown metric type: ' + type);
        return {};
    }
  };

  console.log(getTooltipMetricData(popupData, 'incidence'))

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <p className={styles.stateName}>
            {flag && <img src={flag} />}
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
                <p className={classNames(styles[d.slug], styles.label)}>{d.label}</p>
                <p className={classNames(
                  styles[d.slug],
                  styles.value,
                  {
                    [styles['notAvail']]: d.notAvail,
                    [styles.zero]: d.slug === 'incidence' && d.valueNum === 0,
                  },
                )}>
                  {d.notAvail ? 'Recent data not available' : d.value}
                  {
                    // If value2 exists, add that
                    (d.value2 !== undefined) && <span className={styles.value2}>{d.value2}</span>
                    // (d.value2 !== undefined) && <div className={styles.value2}>{d.value2}</div>
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
                      <span className={styles['delta-text']}>{getDeltaWord(d.deltaData.delta)} from<br/>previous month</span>
                    </div>
                  }
                </p>
                {
                  (d.dataSource && !d.notAvail) &&
                    <div className={'dataSource'}>
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
