import React from 'react'
import classNames from 'classnames'
import styles from './source.module.scss'

/**
 * Source text beneath charts and tables documenting where the data were
 * originally sourced from.
 * @method Source
 */
const Source = ({ data, override, left, ...props }) => {
  // TODO inherit classNames as props

  /**
   * Determines the correct data source text to display for the input data. If
   * override is defined, that text will be displayed.
   * @method getSourceText
   * @param  {[type]}      data     [description]
   * @param  {[type]}      override [description]
   * @return {[type]}               [description]
   */
  const getSourceText = (data, override) => {
    if (override !== undefined) return override
    else return '' // TODO
  }
  return (
    <div
      className={classNames(
        'dataSource',
        props.className ? props.className : ''
      )}
    >
      {getSourceText(data, override)}
    </div>
  )
}

export default Source
