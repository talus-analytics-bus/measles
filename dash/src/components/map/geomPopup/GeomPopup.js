import React from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

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
          <p className={styles.dataDateStamp}>
            {
              'as of ' + new Date('7/01/2019').toLocaleString('en-us', { // TODO correctly
                month: 'long',
                year: 'numeric',
              })
          }
          </p>
        }
        <div className={styles.data}>
          {
            [
              {
                slug: 'cases',
                label: 'Measles cases reported',
                value: popupData['bubble']['value'] + ' people', // TODO comma sep int
                delta: popupData['trend']['percent_change'],
                deltaLabel: 'increase from prior 30 days', // TODO inc/dec dynamically
                notAvail: false,
                dataSource: popupData['bubble']['data_source'],
              },
              {
                slug: 'prevalence',
                label: 'Prevalence of measles',
                value: 'Data not available', // TODO comma-sep int
                notAvail: true,
              },
              {
                slug: 'vacc-coverage',
                label: 'Vaccination coverage',
                value: parseFloat(popupData['fill']['value']).toFixed(0)+"% of infants",
                notAvail: false,
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
                )}>{d.value}</p>
                {
                  d.dataSource && <p className={'dataSource'}>Source: {d.dataSource}</p>
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
