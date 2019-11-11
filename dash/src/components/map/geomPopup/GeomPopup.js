import React from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import Util from '../../misc/Util.js'

import styles from './geomPopup.module.scss'

// : React.FC
const GeomPopup = ({ popupData, bubbleMetric }) => {
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
          unit: ['cases per', '1M population'],
          deltaData: Util.getDeltaData(popupData['trend']),
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
          valueNum: obs['value'],
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

  const renderUnit = (unitData) => {
    if (typeof(unitData) === 'object') {
      return (
        unitData.map(d =>
          <div>
          {d}
          <br/>
          </div>
        )
      );
    }
    else return (<div>{unitData}</div>);
  };

  const tooltipItems = bubbleMetric === 'incidence_monthly' ?
      [
        getTooltipMetricData(popupData, 'incidence'),
        getTooltipMetricData(popupData, 'fill'),
        // getTooltipMetricData(popupData, 'bubble'),
      ]
    :
      [
        getTooltipMetricData(popupData, 'bubble'),
        getTooltipMetricData(popupData, 'fill'),
        // getTooltipMetricData(popupData, 'incidence'),
      ];

  // https://medium.com/@webcore1/react-fallback-for-broken-images-strategy-a8dfa9c1be1e
  const addDefaultSrc = (ev) => {
    ev.target.src = '/flags/unspecified.png';
  };

  return (
    <div className={classNames(styles.container, styles[bubbleMetric])}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <p className={styles.stateName}>
            {flag && <img src={flag} onError={(e) => addDefaultSrc(e)} />}
            {popupData['fill'] ? popupData['fill']['place_name'] : popupData['place_name']}
          </p>
        </div>
      </div>
      <div>
        <div className={styles.data}>
          {
            tooltipItems.map(d =>
              <div className={classNames(
                styles[d.slug],
                styles.datum
              )}>
                <p className={classNames(styles[d.slug], styles.label)}>
                  <span>{d.label}</span>
                  <span className={'dateTimeStamp'}>{d.dateFmt && `${d.dateFmt}`}</span>
                </p>
                <p className={classNames(
                  styles[d.slug],
                  styles.content,
                  {
                    [styles['notAvail']]: d.notAvail,
                    [styles.zero]: d.valueNum !== undefined && d.valueNum === 0,
                  },
                )}>
                  <div className={styles.value}>
                  {d.notAvail ? 'Recent data not available' : d.value}
                  </div>
                  {
                    d.notAvail ? '' : <div className={styles.unit}>{renderUnit(d.unit)}</div>
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
