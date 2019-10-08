import React from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import Util from '../../misc/Util.js'

import styles from './geomPopup.module.scss'
// import flags from '../../../assets/images/flags/AD.png'

function importAll(r) {
  let images = {};
  r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
  return images;
}

const flags = importAll(require.context('../../../assets/images/flags/', false, /\.(png|jpe?g|svg)$/));

// : React.FC
const GeomPopup = ({ popupData }) => {
  console.log(popupData)

  const measlesTimestamp = new Date('7/01/2019').toLocaleString('en-us', { // TODO correctly
    month: 'long',
    year: 'numeric',
  });

  const vaccinationTimestamp = new Date('1/01/2018').toLocaleString('en-us', { // TODO correctly
    year: 'numeric',
  });

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

  const getDatetimeStamp = (datum, type = 'year') => {
    if (datum['value'] === null) return '';

    let datetimeStamp;
    const date_time = datum['date_time'].replace(/-/g, '/');
    if (type === 'month') {
      datetimeStamp = new Date(date_time).toLocaleString('en-US', { // TODO correctly
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    } else if (type === 'year') {
      datetimeStamp = new Date(date_time).toLocaleString('en-US', { // TODO correctly
        year: 'numeric',
        timeZone: 'UTC',
      })
    }
    return ` (${datetimeStamp})`;
  };

  const getDeltaData = (datum) => {
    if (datum) {
      return {
        delta: datum['percent_change'] || 0,
        deltaSign: getDeltaSign(datum['percent_change'] || 0),
        deltaFmt: Util.percentizeDelta(datum['percent_change'] || 0),
        deltaLabel: 'increase from prior 30 days', // TODO inc/dec dynamicall
      }
    } else return {

    };
  };

  const detailsPath = '/details/' + popupData['bubble']['place_id']
  const flag = flags[popupData['fill']['place_iso'] + '.png'];
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <p className={styles.stateName}>
            {flag && <img src={flag} />}
            {popupData['fill']['place_name']}
          </p>
        </div>
      </div>
      <div>
        {
          // <p className={styles.dataDateStamp}>
          //   {
          //     new Date('7/01/2019').toLocaleString('en-us', { // TODO correctly
          //       month: 'long',
          //       year: 'numeric',
          //     })
          //   }
          // </p>
        }
        <div className={styles.data}>
          {
            [
              {
                slug: 'incidence',
                label: 'Incidence of measles' + `${getDatetimeStamp(popupData['incidence'], 'month')}`,
                value: Util.formatIncidence(popupData['incidence']['value']) + ' cases per 1M population', // TODO comma-sep int
                notAvail: popupData['incidence']['value'] === null, // TODO dynamically
                dataSource: popupData['incidence']['data_source'],
                dataSourceLastUpdated: new Date (popupData['incidence']['updated_at']),
              },
              {
                slug: 'cases',
                label: 'Measles cases reported' + `${getDatetimeStamp(popupData['bubble'], 'month')}`,
                value: Util.comma(popupData['bubble']['value']) + ' ' + getPeopleNoun(popupData['bubble']['value']), // TODO comma sep int
                deltaData: getDeltaData(popupData['trend']),
                // delta: popupData['trend']['percent_change'],
                // deltaSign: getDeltaSign(popupData['trend']['percent_change']),
                // deltaFmt: Util.percentizeDelta(popupData['trend']['percent_change']),
                // deltaLabel: 'increase from prior 30 days', // TODO inc/dec dynamically
                notAvail: popupData['bubble']['value'] === null,
                dataSource: popupData['bubble']['data_source'],
                dataSourceLastUpdated: new Date (popupData['bubble']['updated_at']),
              },
              {
                slug: 'vacc-coverage',
                label: 'Vaccination coverage' + `${getDatetimeStamp(popupData['fill'], 'year')}`,
                value: parseFloat(popupData['fill']['value']).toFixed(0)+"% of infants",
                dataSource: popupData['fill']['data_source'],
                dataSourceLastUpdated: new Date (popupData['fill']['updated_at']),
                notAvail: false, // TODO dynamically
              },
            ].map(d =>
              <div className={classNames(styles[d.slug], styles.datum)}>
                <p className={classNames(styles[d.slug], styles.label)}>{d.label}</p>
                <p className={classNames(
                  styles[d.slug],
                  styles.value,
                  {
                    [styles['notAvail']]: d.notAvail,
                  },
                )}>
                  {d.notAvail ? 'Recent data not available' : d.value}
                  {
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
                            month: 'long',
                            year: 'numeric',
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
