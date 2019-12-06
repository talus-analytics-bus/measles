import React from 'react'
import { Link } from 'react-router-dom'
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
   * Returns true if no data, false otherwise.
   * @method noData
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const noData = data => {
    let noData = false
    data.forEach(dataType => {
      // If array is empty, return true (no data)
      const arrayEmpty = dataType.data.length === 0
      if (arrayEmpty) noData = true
      else {
        // Otherwise, if the first element of the array is empty (e.g., no
        // data source has been defined), then return true (no data).
        const arrayElementEmpty = dataType.data[0].data_source === undefined
        if (arrayElementEmpty) noData = true
      }
    })

    // Return whether there was no data.
    return noData
  }

  /**
   * Given an array, joins the strings with commas or "and" as appropriate. The
   * resulting text string will link the array element strings together using
   * an Oxford comma if applicable.
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
    if (override !== undefined && override !== false) return [override]
    if (data === undefined || noData(data)) return ['']

    // Define array to hold final data source text.
    const sourceArr = []

    // Structure of data:
    // [
    //   {
    //     sourceLabel: 'Source', // text appearing at start of source label
    //     data: [{...}, {...}, {...}] // data from which to determine sources
    //   },
    //   {
    //     sourceLabel: 'Source',
    //     data: [{...}, {...}, {...}]
    //   },
    //   ...
    // ]

    // Sort data by "updated_at" field so that most recently published data are
    // cited first.
    const sortFunc = Util.sortByField('updated_at')

    // For each type of data that needs to be attributed in the source text:
    data.forEach(dataType => {
      // Define object to hold data source information that will be concatenated
      // and displayed as the source text.
      const sourceObj = {}

      // For each datum in this datatype:
      dataType.data.forEach(d => {
        // Get obj of all the unique data sources and their "updated_at" values
        // in the dataset.

        // If the data source hasn't yet been seen in the dataset:
        if (sourceObj[d.data_source] === undefined) {
          // Add it
          sourceObj[d.data_source] = {
            n: 1, // number of times source appeared
            data_source: d.data_source, // source name
            updated_at: Util.getDateObject(d.updated_at), // when published
            place_names: [d.place_name] // locations citing it
          }
        } else {
          // Increment the count (number of times source appeared in data)
          sourceObj[d.data_source].n += 1

          // Add place name if it's not there already
          if (!sourceObj[d.data_source].place_names.includes(d.place_name))
            sourceObj[d.data_source].place_names.push(d.place_name)

          // If this "updated_at" is more recent, use it instead
          const newUpdatedAt = Util.getDateObject(d.updated_at)
          if (sourceObj[d.data_source].updated_at < newUpdatedAt) {
            sourceObj[d.data_source].updated_at = newUpdatedAt
          }
        }
      })

      // Reshape data into array to support concatenating it into a string
      const sources = Object.values(sourceObj).sort(sortFunc)

      // Define array to hold names of places for which a separate dataset was
      // used (i.e., the country is the only one covered by the dataset).
      const placesCoveredBySeparateDataset = []

      // Create array to hold unique sources for this datatype.
      const dataTypeSourceArr = []

      // Collate data source string from the source object.
      sources.forEach(s => {
        // If the flag to call out places covered by separate datasets is true:
        if (props.placesCoveredBySeparateDataset === true) {
          // And this data source has only been cited once:
          // TODO fix this, should instead check whether number of places
          // citing the data source is equal to 1

          if (s.place_names.length === 1 && s.place_names[0] !== 'World') {
            // If the list of places covered by a "separate" dataset does not
            // yet include this place, add it
            if (!placesCoveredBySeparateDataset.includes(s.place_names[0])) {
              placesCoveredBySeparateDataset.push(s.place_names[0])
            }
            return
          }
        }

        // Add the data source to the overall list for this datatype.
        dataTypeSourceArr.push(
          `${s.data_source} as of ${s.updated_at.toLocaleString('en-us', {
            month: 'short',
            year: 'numeric'
          })}`
        )
      })

      // If there are data sources applicable to only one country, then
      // list the countries instead of the data sources and link to the About
      // page relevant content.
      let separatePlacesStr
      if (placesCoveredBySeparateDataset.length > 0) {
        separatePlacesStr = (
          <span>
            Additional data sources used for{' '}
            {joinArrayStrings(placesCoveredBySeparateDataset)} as described in
            the <Link to='/about#dataSources'>methods</Link>.
          </span>
        )
      }

      // Concatenate the data sources for this type into a single string.
      const dataTypeSourceText = joinArrayStrings(dataTypeSourceArr)

      // Add the string for this type to the overall source array.
      sourceArr.push(
        <span>
          {dataType.sourceLabel}: {dataTypeSourceText}.
        </span>
      )

      // If there were places covered by their own separate data sources, add
      // the string that mentions them.
      if (separatePlacesStr !== undefined) sourceArr.push(separatePlacesStr)

      // TODO if there are more than three, truncate to "and others" and include
      // a link to the About page relevant content.
    })

    // Return concatenated data source text.
    return sourceArr
  }
  return (
    <div
      className={classNames(
        'dataSource',
        props.className ? props.className : '',
        {
          [styles.right]: left !== true
        }
      )}
    >
      {getSourceText(data, override).map((jsx, i) => getSourceJsx(jsx, i))}
    </div>
  )
}

/**
 * Return source text JSX with or without a space preceding it as appropriate.
 * @method getSourceJsx
 * @param  {[type]}     jsx [description]
 * @param  {[type]}     i   [description]
 * @return {[type]}         [description]
 */
const getSourceJsx = (jsx, i) => {
  // If it's the first source text item, don't precede with a space, otherwise
  // do.
  if (i === 0) return <span>{jsx}</span>
  else return <span>&nbsp;{jsx}</span>
}

/**
 * Given the item, render source data. Item should have value for:
 *  data_source (str)
 *  updated_at (str or Date)
 *  source_data (see "shapeInfo" above)
 *  notAvail (bool)
 * @method renderSourceForItem
 * @param  {[type]}            item [description]
 * @return {[type]}                 [description]
 */
export const renderSourceForItem = (item, params = {}) => {
  return (
    // Display data source text if available.
    !item.notAvail && (
      <Source
        className={styles.source}
        data={item.source_data}
        placesCoveredBySeparateDataset={
          item.placesCoveredBySeparateDataset === true
        }
        left={
          (params.left === undefined && params.right === undefined) ||
          (params.left !== undefined && params.left === true) ||
          (params.right !== undefined && params.right === false)
        }
        override={
          item.source_data === undefined && (
            <span>
              {'Source:'} {item.data_source}
              {item.updated_at &&
                ' as of ' +
                  new Date(item.updated_at).toLocaleString('en-us', {
                    month: 'short',
                    year: 'numeric'
                  })}
            </span>
          )
        }
      />
    )
  )
}

export default Source
