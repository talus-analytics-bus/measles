import React from 'react'
import classNames from 'classnames'
import styles from './yearlyreport.module.scss'
import Util from './Util.js'

/**
 * Yearly metric report for countries that have irregular WHO data reporting.
 * Simple table of metric by year with data source.
 * @method YearlyReport
 */
const YearlyReport = props => {
  const yearlyReportData = {
    caseload_totalpop: {
      VE: {
        values: [
          { value: 449, year: 2019 },
          { value: 5668, year: 2018 },
          { value: 727, year: 2017 },
          { value: 1, year: 2016 },
          { value: 0, year: 2015 },
          { value: 0, year: 2014 },
          { value: 0, year: 2013 },
          { value: 1, year: 2012 },
          { value: 0, year: 2011 }
        ],
        data_source: 'WHO Measles Surveillance Data as of Nov 2019'
      }
    },
    incidence_yearly: {
      VE: {
        values: [
          { value: 18.23548598, year: 2019 },
          { value: 196.2120346, year: 2018 },
          { value: 24.72580544, year: 2017 },
          { value: 0.033499436, year: 2016 },
          { value: 0, year: 2015 },
          { value: 0, year: 2014 },
          { value: 0, year: 2013 },
          { value: 0.034058986, year: 2012 },
          { value: 0, year: 2011 }
        ],
        data_source:
          'WHO Measles Surveillance Data and UN World Population Prospects as of Nov 2019'
      }
    }
  }
  const paramName =
    props.metric === 'caseload_totalpop'
      ? 'caseload_totalpop'
      : 'incidence_yearly'
  const metricParams = Util.getMetricChartParams(paramName)
  const data = yearlyReportData[paramName][props.place_iso]
  const metricName =
    props.metric === 'caseload_totalpop'
      ? 'Measles caseloads'
      : 'Measles incidence rates'

  const showBothMetrics = props.showBothMetrics
  let otherMetricParams
  if (showBothMetrics) {
    otherMetricParams = Util.getMetricChartParams('incidence_yearly')
  }

  return (
    <div
      className={classNames(styles.yearlyReport, {
        [styles.inTooltip]: props.inTooltip
      })}
    >
      <p>
        {metricName} for {props.place_name} are currently only available by
        year. Data for all years on record are provided in the table below.
      </p>
      <table>
        <tr>
          <td>Year</td>
          <td>
            {metricParams.name} ({metricParams.units})
          </td>
          {showBothMetrics && (
            <td>
              {otherMetricParams.name} ({otherMetricParams.units})
            </td>
          )}
        </tr>
        {data.values.map(d => (
          <tr>
            <td>{d.year}</td>
            <td>{metricParams.tickFormatLong(d.value)}</td>
            {showBothMetrics && (
              <td>
                {otherMetricParams.tickFormatLong(
                  yearlyReportData['incidence_yearly'][
                    props.place_iso
                  ].values.find(dd => dd.year === d.year).value
                )}
              </td>
            )}
          </tr>
        ))}
      </table>
      <div className={classNames('dataSource', styles.dataSource)}>
        Source:{' '}
        {!showBothMetrics
          ? data.data_source
          : yearlyReportData['incidence_yearly'][props.place_iso].data_source}
      </div>
    </div>
  )
}

export default YearlyReport
