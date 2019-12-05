import React from 'react'
import classNames from 'classnames'
import styles from './shapelegend.module.scss'
import Util from '../../misc/Util.js'

/**
 * Create a series of horizontally spaced circles with labels. The input should
 * follow the format of "shapeInfo" below.
 * @method ShapeLegend
 * @param  {object}     shapeInfo [description]
 * @param  {object}     props      [description]
 */
const ShapeLegend = ({ shapeInfo, ...props }) => {
  // Circle info structure:
  if (shapeInfo === undefined)
    shapeInfo = [
      {
        label: ['<30% increase,', 'or decrease'],
        color: Util.changeColors.same
      },
      {
        label: ['Increase of', '30% or more'], // lines of text
        color: '#b02c3a' // of circle
      },
      {
        label: ['Data not', 'available'],
        color: Util.changeColors.missing
      }
    ]

  // What shape should be used: circle or rect
  const shape = props.shape !== undefined ? props.shape : 'rect'

  return (
    <div className={styles.ShapeLegend}>
      {shapeInfo.map(c => (
        <div className={styles.entry}>
          <div className={styles[shape]} style={{ backgroundColor: c.color }} />
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
export default ShapeLegend
