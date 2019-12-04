import React from 'react'
import classNames from 'classnames'
import styles from './source.module.scss'
import Util from './Util.js'

/**
 * Source text beneath charts and tables documenting where the data were
 * originally sourced from.
 * @method Source
 */
const Source = ({ data, override, left, ...props }) => {
  /**
   * Given an array, joins the strings with commas or "and" as appropriate.
   * @method joinArrayStrings
   * @param  {[type]}         arr [description]
   * @return {[type]}             [description]
   */
  const joinArrayStrings = arr => {
    if (arr.length <= 1) return arr.join('')
    else if (arr.length === 2) return arr.join(' and ')
    else {
      const commaStr = arr.slice(0, arr.length - 1).join(', ')
      return `${commaStr}, and ${arr[arr.length - 1]}`
    }
  }

  /**
   * Determines the correct data source text to display for the input data. If
   * override is defined, that text will be displayed.
   * @method getSourceText
   * @param  {[type]}      data     [description]
   * @param  {[type]}      override [description]
   * @return {[type]}               [description]
   */
  const getSourceText = (data, override) => {
    console.log('data - source.js')
    console.log(data)
    console.log('override - source.js')
    console.log(override)
    if (override !== undefined && override !== false) return override
    if (data === undefined) return ''

    // Define array to hold final data source text.
    const sourceArr = []

    // Structure of data:
    // [
    //   {
    //     sourceLabel: 'Source',
    //     data: [{...}, {...}, {...}]
    //   },
    //   {
    //     sourceLabel: 'Source',
    //     data: [{...}, {...}, {...}]
    //   },
    //   ...
    // ]

    // For each type of data that needs to be attributed in the source text:
    data.forEach(dataType => {
      // Define object to hold data source information that will be concatenated
      // and displayed as the source text.
      const sourceObj = {}

      // For each datum in this datatype:
      dataType.data.forEach(d => {
        // Get a dict of all the unique data sources and their "updated_at" values
        // in the dataset.
        if (sourceObj[d.data_source] === undefined) {
          // Add it
          sourceObj[d.data_source] = {
            n: 1,
            updated_at: Util.getDateObject(d.updated_at),
            place_names: [d.place_name]
          }
        } else {
          // Increment the count
          sourceObj[d.data_source].n += 1

          // Add place name if it's not there
          if (!sourceObj[d.data_source].place_names.includes(d.place_name))
            sourceObj[d.data_source].place_names.push(d.place_name)

          // If this "updated_at" is more recent use it instead
          const newUpdatedAt = Util.getDateObject(d.updated_at)
          if (sourceObj[d.data_source].updated_at < newUpdatedAt) {
            sourceObj[d.data_source].updated_at = newUpdatedAt
          }
        }
      })

      // Define array to hold names of places for which a separate dataset was
      // used (i.e., the country is the only one covered by the dataset).
      const placesCoveredBySeparateDataset = []

      // Create array to hold unique sources for this datatype.
      const dataTypeSourceArr = []

      // Collate data source string from the source object.
      for (let [k, v] of Object.entries(sourceObj)) {
        // If the flag to call out places covered by separate datasets is true:
        if (props.placesCoveredBySeparateDataset === true) {
          if (v.n === 1) {
            if (!placesCoveredBySeparateDataset.includes(v.place_names[0])) {
              placesCoveredBySeparateDataset.push(v.place_names[0])
            }
            continue
          }
        }

        // Add the data source.
        dataTypeSourceArr.push(
          `${k} as of ${v.updated_at.toLocaleString('en-us', {
            month: 'short',
            year: 'numeric'
          })}`
        )
      }

      // Concatenate the data sources for this type into a single string.
      const dataTypeSourceText = joinArrayStrings(dataTypeSourceArr)

      // Add the string for this type to the overall source array.
      sourceArr.push(`${dataType.sourceLabel}: ${dataTypeSourceText}`)

      // Sort them in order of frequency. MAYBE?

      // TODO if there are more than three, truncate to "and others" and include
      // a link to the About page relevant content.

      // TODO if there are data sources applicable to only one country, then
      // list the countries instead of the data sources and link to the About
      // page relevant content.
      // Push name of country to list of countries to mention in this way.

      // Push
      //   {
      //     data_source: 'xxx',
      //     updated_at: 'xxx'
      //   }
    })

    // Return concatenated data source text.
    return sourceArr.join('. ') + '.'
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
