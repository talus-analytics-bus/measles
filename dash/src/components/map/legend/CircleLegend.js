import React from 'react'
import classNames from 'classnames'
import styles from './circlelegend.module.scss'
import Util from '../../misc/Util.js'

/**
 * Create a series of horizontally spaced circles with labels. The input should
 * follow the format of "circleInfo" below.
 * @method CircleLegend
 * @param  {object}     circleInfo [description]
 * @param  {object}     props      [description]
 */
const CircleLegend = ({ circleInfo, ...props }) => {
  // Circle info structure:
  if (circleInfo === undefined)
    circleInfo = [
      {
        label: ['Significant', '(30+% increase)'], // lines of text
        color: '#b02c3a' // of circle
      },
      {
        label: ['Not significant,', 'or decrease'],
        color: Util.changeColors.same
      },
      {
        label: ['Data not', 'available'],
        color: Util.changeColors.missing
      }
    ]

  return (
    <div className={styles.circleLegend}>
      {circleInfo.map(c => (
        <div className={styles.entry}>
          <div className={styles.circle} style={{ backgroundColor: c.color }} />
          <div className={styles.label}>
            {c.label.map(l => (
              <span>
                {l}
                <br />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
export default CircleLegend
