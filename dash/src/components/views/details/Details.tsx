import React from 'react'
import Popup from 'reactjs-popup'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Chart from '../../chart/Chart.js'

import Content from './content/Content'

// Utilities (date formatting, etc.)
import Util from '../../../components/misc/Util.js'
import Query from '../../../components/misc/Query.js'

import classNames from 'classnames'
import styles from './details.module.scss'

// If DEMO_DATE exists, use it (frames all data in site relative to the demo
// date that is specified). Otherwise, today's date will be used ("now").
var DEMO_DATE = process.env.DEMO_DATE
if (typeof DEMO_DATE === 'undefined') {
  DEMO_DATE = '2025-07-04T23:56:00'
}

const now = DEMO_DATE !== undefined ? new Date(DEMO_DATE) : new Date();

// import { facility } from '../../../types/index'
const API_BASE = process.env.REACT_APP_API_BASE_URL;

// FC for Details.
const Details = (props: any) => {

  // Manage loading state (don't show if loading, etc.)
  const [loading, setLoading] = React.useState(true)

  // Get data for current country.
  const country = props.id;
  const [countryName, setCountryName] = React.useState('');

  // total population
  const [countryPop, setCountryPop] = React.useState(0);

  // GDP per capita
  const [countryGDP, setCountryGDP] = React.useState(0);

  // JEE Score
  const [countryJEE, setCountryJEE] = React.useState(0);

  //Policies (doubt we get this by October?)

  // Vaccination coverage
  const coverage = props.coverage;

  // Reported cases
  const cases = props.cases;

  // Reported cases over time
  const [caseHistory, setCaseHistory]  = React.useState([]);

  // Vaccination coverage over time
  const [coverageHistory, setCoverageHistory] = React.useState([]);

  // Function to make API calls to get data for the state variables above.
  const getDetailsData = async () => {
    var countryPopQ = await Query(3, 'yearly', '2018-01-01', '2018-01-01', country);
    setCountryPop(countryPopQ[0]['value']);
    setCountryName(countryPopQ[0]['place_name'])

    var countryGDPQ = await Query(14, 'yearly', '2018-01-01', '2018-01-01', country);
    console.log(countryGDPQ)
    setCountryGDP(countryGDPQ[0]['value']);

    var countryJEEQ = await Query(6, 'monthly', '2019-07-01', '2019-07-01', country);
    setCountryJEE(countryJEEQ[0]['value']);

    setCaseHistory(await Query(6, 'monthly', '2010-01-01', '2018-01-01', country));
    setCoverageHistory(await Query(4, 'yearly', '2010-01-01', '2018-01-01', country));

    setLoading(false);
  }

  // Effect hook to load API data.
  React.useEffect(() => {
    getDetailsData();
  }, [])

  // If loading do not show JSX content.
  if (loading) return (<div></div>);
  else {
    console.log(countryPop)
    console.log(countryGDP)
    console.log(countryJEE)

    // Get datetime stamp for facility status and other elements
    const timeThreshold = DEMO_DATE !== undefined ? new Date(DEMO_DATE) : new Date();

    return (<div>
              <div>
                <p>{countryName}</p>
                <p>Country Population: {countryPop}</p>
                <p>GDP per-capita: {countryGDP}</p>
                <p>JEE: {countryJEE}</p>
              </div>
              <div>
                <p>Coverage</p>
                <Chart
                  metric={coverageHistory}
                />
              </div>
              <div>
                <p>Cases</p>
                <Chart
                  metric={caseHistory}
                />
              </div>
            </div>
    );
  }
};

export default Details
