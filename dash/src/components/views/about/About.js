import React from 'react'
import styles from './about.module.scss'

// JSX for about page.
const About = () => {
  // Scroll to top of window afer loading.
  React.useEffect(() => window.scrollTo(0, 0), [])

  return (
    <div className={styles.about}>
      <h1>Overview</h1>
      <p>
        Measles Tracker was developed by Talus Analytics to provide up-to-date
        information on global measles outbreaks and vaccination coverage,
        providing a global picture to support public health decision making and
        efforts to control and eliminate measles. The dashboard provides access
        to analysis and data visualizations communicating the status of ongoing
        outbreaks relative to who is vaccinated, where, and whether these
        outbreaks are worsening. These trends in vaccination and measles
        caseload are provided at the country level with the ability to view
        global comparisons and draw new insights by bringing together the best
        available data tracking measles cases and vaccination coverage,
        currently and over time. Where available, key information about country
        capacity to prevent, detect, and rapidly respond to public health
        threats is also included in the form of assessment results from the
        Joint External Evaluation process performed under the International
        Health Regulations.
      </p>

      <p>
        Development and maintenance of the Measles Tracker dashboard is funded
        by Talus Analytics which is solely responsible for its content. Talus
        Analytics exclusively owns and reserves the right to all visualizations,
        novel analyses, and site design. For any questions about use of Measles
        Tracker or its data and analysis, please email{' '}
        <a href='mailto:info@talusanalytics.com' target='_blank'>
          info@talusanalytics.com
        </a>
        . For more information on Talus Analytics, please visit our website{' '}
        <a href='http://talusanalytics.com/' target='_blank'>
          here
        </a>
        .
      </p>
      <h2>Measles information and vaccination recommendations&nbsp;</h2>
      <p>
        Measles is a highly infectious disease caused by a virus and is spread
        from person to person through coughing and sneezing. The US Centers for
        Disease Control and Prevention (CDC) &nbsp;provides information about
        measles and answers to common questions{' '}
        <a target='_blank' href='https://www.cdc.gov/measles/index.html'>
          here
        </a>{' '}
        on their website. The most effective way to prevent a measles infection
        is with a measles vaccine. Vaccination guidance from the CDC is
        available{' '}
        <a target='_blank' href='https://www.cdc.gov/measles/vaccination.html'>
          here
        </a>
        , and additional guidance from the World Health Organization (WHO) can
        be found by visiting this{' '}
        <a
          target='_blank'
          href='https://www.who.int/immunization/diseases/measles/en/'
        >
          page
        </a>
        .
      </p>
      <h1>Measles Tracker data and methods documentation</h1>
      <p>
        Below, we describe the sources of data integrated within the dashboard
        and the analytical methods used to analyze and communicate those data.
      </p>
      <h2>Data types and sources</h2>
      <p>
        Vaccination coverage data define the percent of the population who have
        been vaccinated for measles. Typically, measles vaccination occurs in a
        two dose sequence of measles-containing vaccine (MCV), so vaccination
        coverage can be reported as the percent of the population who have
        received at least one dose of measles-containing vaccine (MCV1), or the
        percent of the population who have received two doses of
        measles-containing vaccine (MCV2).
        <a
          className={styles.footnoteInline}
          href='#_ftn1'
          name='_ftnref1'
          title=''
        >
          [1]
        </a>{' '}
        This two-dose course of measles is believed to provide lifetime
        immunity, and booster doses are typically not needed.
        <a
          className={styles.footnoteInline}
          href='#_ftn2'
          name='_ftnref2'
          title=''
        >
          [2]
        </a>{' '}
        As a result, vaccination coverage data are typically reported on an
        annual basis, and the majority of vaccination efforts are focused largely
        on infants.
      </p>

      <p>
        Caseload data in Measles Tracker are the total number of new measles
        (rubeola) cases, not including rubella cases, in a given geography at a
        given point in time. WHO member states submit monthly reports to WHO
        containing information on both measles and rubella cases. The data are
        then published by WHO separately for each disease. The data are reported
        in monthly increments and include laboratory confirmed,
        epidemiologically linked, and/or clinical cases. Additional information
        regarding these data can be accessed{' '}
        <a
          target='_blank'
          href='https://www.who.int/immunization/monitoring_surveillance/burden/vpd/surveillance_type/active/measles_monthlydata/en/'
        >
          here
        </a>
        . For select countries where caseload data are not available or
        adequately captured from monthly WHO surveillance reports, alternate
        sources are used (see below). Based on these available caseload data, it
        is possible to calculate the monthly incidence rate, or the number of
        persons newly diagnosed with measles, per 1,000,000 total population,
        per month.
        <a
          className={styles.footnoteInline}
          href='#_ftn3'
          name='_ftnref3'
          title=''
        >
          [3]
        </a>
      </p>

      <p>
        To provide context for existing public health capacity, and to enable
        comparisons between countries, vaccination coverage and caseload data
        are presented alongside scores from voluntary Joint External Evaluations
        under the International Health Regulations, which assess capacity to
        prevent, detect, and respond to public health threats.
      </p>
      <p>
        Table 1, below, provides an overview of data sources currently used for
        each of the data types described in the above sections. &nbsp;
      </p>

      <p>
        <strong>Table 1:</strong> Sources of data currently displayed in the
        Measles Dashboard
      </p>
      <table width='863'>
        <thead>
          <tr>
            <td rowspan='2' width='97'>
              <p>
                <strong>Data element</strong>
              </p>
            </td>
            <td colspan='7' width='766'>
              <p>
                <strong>Information on data source(s) used</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td width='110'>
              <p>
                <strong>Source of data</strong>
              </p>
            </td>
            <td width='192'>
              <p>
                <strong>Brief description</strong>
              </p>
            </td>
            <td width='77'>
              <p>
                <strong>Temporal resolution</strong>
              </p>
            </td>
            <td width='93'>
              <p>
                <strong>Geographic resolution</strong>
              </p>
            </td>
            <td width='102'>
              <p>
                <strong>Population(s)</strong>
              </p>
            </td>
            <td width='97'>
              <p>
                <strong>Most recent available data</strong>
              </p>
            </td>
            <td width='96'>
              <p>
                <strong>Update frequency</strong>
              </p>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td width='97'>
              <p>Vaccination coverage</p>
              <p>
                <em>ages 12-23 months</em>
              </p>
            </td>
            <td width='110'>
              <p>
                WHO/UNICEF Estimates of National Immunization Coverage (WUENIC)
              </p>
            </td>
            <td width='192'>
              <p>
                Data report yearly vaccination coverage estimates for children
                ages 12 &ndash; 23 months for all WHO member countries. Data are
                only available for past years.
              </p>
            </td>
            <td width='77'>
              <p>yearly</p>
            </td>
            <td width='93'>
              <p>country</p>
            </td>
            <td width='102'>
              <p>ages 12-23 months</p>
            </td>
            <td width='97'>
              <p>2018</p>
            </td>
            <td width='96'>
              <p>3 times per year (June, July, and December)</p>
            </td>
          </tr>
          <tr>
            <td width='97'>
              <p>Measles caseload</p>
              <p>
                <em>Total population</em>
              </p>
            </td>
            <td width='110'>
              <p>WHO Measles Surveillance Data</p>
            </td>
            <td width='192'>
              <p>
                Data report the number of new measles cases reported by month
                for all WHO member countries.
              </p>
            </td>
            <td width='77'>
              <p>monthly</p>
            </td>
            <td width='93'>
              <p>country</p>
            </td>
            <td width='102'>
              <p>total population</p>
            </td>
            <td width='97'>
              <p>
                January 2021
                <a
                  className={styles.footnoteInline}
                  href='#_ftn4'
                  name='_ftnref4'
                >
                  [4]
                </a>
              </p>
            </td>
            <td width='96'>
              <p>approximately monthly</p>
            </td>
          </tr>
          <tr>
            <td width='97'>
              <p>Measles caseload</p>
              <p>
                <em>Data not yet reported to WHO for current outbreaks</em>
              </p>
            </td>
            <td width='110'>
              <p>
              Web scraping or manual data capture from ministry of health
              websites, official social media, or other reports
              </p>
            </td>
            <td width='192'>
              <p>
                During ongoing outbreaks, reported cases to WHO by a member
                state may lag behind the best available case reports
                disseminated via other sources. Where possible, data are
                captured from other reputable sources of country reporting
                (e.g., official government social media and websites during late
                2019 outbreak in Samoa).
              </p>
            </td>
            <td width='77'>
              <p>
              monthly
              <a
                className={styles.footnoteInline}
                href='#_ftn5'
                name='_ftnref5'
              >
                [5]
              </a>
              </p>
            </td>
            <td width='93'>
              <p>country</p>
            </td>
            <td width='102'>
              <p>total population</p>
            </td>
            <td width='97'>
              <p>varies</p>
            </td>
            <td width='96'>
              <p>varies</p>
            </td>
          </tr>
          <tr>
            <td width='97'>
              <p>Total population</p>
            </td>
            <td width='110'>
              <p>UN World Population Prospects</p>
            </td>
            <td width='192'>
              <p>
                Data report <i>de facto</i> population estimates and projections
                for all countries in the world.
              </p>
            </td>
            <td width='77'>
              <p>yearly</p>
            </td>
            <td width='93'>
              <p>country</p>
            </td>
            <td width='102'>
              <p>total population</p>
            </td>
            <td width='97'>
              <p>2019</p>
            </td>
            <td width='96'>
              <p>every two years</p>
            </td>
          </tr>
          <tr>
            <td width='97'>
              <p>Country capacity</p>
              <p>
                <em>select JEE scores</em>
              </p>
            </td>
            <td width='110'>
              <p>Joint External Evaluation (JEE) scores</p>
            </td>
            <td width='192'>
              <p>
                The JEE measures country specific progress in developing
                capacities to prevent, detect, and rapidly respond to public
                health risks.
              </p>
            </td>
            <td width='77'>
              <p>one-time observation per country</p>
            </td>
            <td width='93'>
              <p>country</p>
            </td>
            <td width='102'>
              <p>total population</p>
            </td>
            <td width='97'>
              <p>August 2019</p>
            </td>
            <td width='96'>
              <p>updated on a rolling basis</p>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Data analysis, processing, and integration</h2>
      <h3>Calculating monthly incidence rates</h3>
      <p>
        Monthly incidence rates for the total population are estimated as the
        number of new measles cases in the most recent month for which data are
        available divided by the total population size. These data are reported
        as the number of cases per 1,000,000 total population per month, and are
        calculated using measles caseload data from WHO and population
        demographic data from the UN World Population Prospects.
      </p>
      <h3>Quantifying increase and decrease in monthly caseload</h3>
      <p>
        Available caseload data report the number of new cases per country, per
        month. An outbreak is indicated as “increasing” if the number of new
        cases in the most recent month for which data are available is greater
        than the number of new cases in the prior month. The percent change in
        new cases from month to month is calculated as the difference in the
        total number of new cases between the current month and the prior month,
        divided by the total number of new cases in the prior month.
      </p>
      <h3>Addressing missing (or not-yet reported) caseload data</h3>
      <p>
        Countries report caseload data to WHO every 1-2 months, and not always
        at the same frequency. In data available from the World Health
        Organization, for the most recent month for which data are available,
        some countries have reported caseload data, and some have not. However,
        the WHO dataset does not distinguish between “data not yet reported” and
        “0 cases reported”. As a result, for the most recent month for which
        data are available, all values of zero are treated as “data not yet
        reported” and therefore a missing value. These values will be
        iteratively updated as new data become available. In the site, the most
        recently available data will be shown, so for countries with these
        missing values indicated for the most recent month, caseload data (with
        appropriate timestamp labels) from the prior month will be shown by
        default until additional data become available.
      </p>

      <p>
        As of January 2021, the WHO Measles Surveillance Dataset contains no
        caseload data for Angola, Botswana, Central African Republic, Congo, 
        Comoros, Cabo Verde, Algeria, Eritrea, Ethiopia, Gabon, Ghana, Guinea, 
        Guinea-Bissau, Equatorial Guinea, Kenya, Liberia, Lesotho, Madagascar, 
        Mali, Mozambique, Mauritania, Mauritius, Malawi, Namibia, Niger, Rwanda, 
        Senegal, Sierra Leone, South Sudan, Sao Tome and Principe, Kingdom of Eswatini, 
        Seychelles, Chad, Togo, United Republic of Tanzania, Uganda, South Africa, 
        Zambia, Zimbabwe, Argentina, Antigua and Barbuda, Bahamas, Belize, Bolivia, 
        Barbados, Canada, Colombia, Costa Rica, Cuba, Dominica, Ecuador, Grenada, 
        Guatemala, Guyana, Jamaica, Saint Kitts and Nevis, Saint Lucia, Panama, 
        Suriname, Trinidad and Tobago, Uruguay, Saint Vincent and the Grenadines, 
        Afghanistan, United Arab Emirates, Djibouti, Egypt, Iran (Islamic Republic of), 
        Iraq, Jordan, Kuwait, Lebanon, Libya, Morocco, Oman, Pakistan, Qatar, 
        Saudi Arabia, Sudan, Somalia, Syrian Arab Republic, Tunisia, Yemen, 
        Albania, Armenia, Austria, Azerbaijan, Belgium, Bulgaria, 
        Bosnia and Herzegovina, Belarus, Cyprus, Czech Republic, Germany, Denmark,
        Spain, Estonia, Finland, France, Georgia, Greece, Croatia, Hungary, Ireland,
        United Kingdom of Great Britain and Northern Ireland, Iceland, Israel, Italy, 
        Kazakhstan, Kyrgyzstan, Lithuania, Luxembourg, Latvia, Monaco, 
        Republic of Moldova, The Republic of North Macedonia, Malta, Montenegro, 
        Netherlands, Norway, Poland, Portugal, Romania, San Marino, Serbia, 
        Slovakia, Slovenia, Sweden, Tajikistan, Turkmenistan, Turkey, Ukraine, 
        Uzbekistan, Bangladesh, Bhutan, Indonesia, India, Sri Lanka, Maldives,
        Myanmar, Nepal, Democratic People's Republic of Korea, Thailand, Timor-Leste,
        Australia, Brunei Darussalam, China, Cook Islands, Fiji, Japan, Cambodia, 
        Micronesia (Federated States of), Kiribati, Republic of Korea, Malaysia, 
        Lao People's Democratic Republic, Marshall Islands, Mongolia, Niue, 
        Nauru, New Zealand, Philippines, Palau, Papua New Guinea, Singapore, 
        Solomon Islands, Tonga, Tuvalu, Viet Nam, Vanuatu, and Samoa for the 
        year 2021. As a result, caseload data are not shown.
      </p>

      <h3><em>2019 outbreak in Samoa</em></h3>
      <p>
        For the 2019 outbreak in Samoa, for which data are not
        adequately captured in the monthly WHO Measles Surveillance Dataset,
        case data were identified through a review of updates from the{' '}
        <a target='_blank' href='https://twitter.com/samoagovt'>
          Government of Samoa Twitter Account
        </a>{' '}
        and initial caseload for the month of October was reported by the Samoa
        Ministry of Health in the{' '}
        <a
          target='_blank'
          href='https://reliefweb.int/sites/reliefweb.int/files/resources/Situational%20Update%20No.%202%20-%20Measles%20cases%20presenting%20up%20until%2027%20October%202019%20%28Date%20of%20report%20-%2030%20October%202019%29.pdf'
        >
          Situational Update No. 2
        </a>{' '}
        published on October 30, 2019. Caseload data from these sources contain
        both suspected and confirmed cases.
      </p>

      <h3><em>2019-2020 outbreak in Democratic Republic of the Congo</em></h3>
      <p>
        For the current 2019-2020 outbreak in the Democratic Republic of the Congo,
        for which data are not adequately captured in the monthly WHO Measles
        Surveillance Dataset, case data were identified through a review of
        updates from the{' '}
        <a target='_blank' href='https://www.afro.who.int/health-topics/disease-outbreaks/outbreaks-and-other-emergencies-updates?page=0'>
        WHO Africa Outbreaks and Emergencies Weekly Bulletins
      </a>{' '}
        . Caseload data from this source contain both suspected and confirmed
        cases.
        </p>

      <h3>Comparison of caseload data sources</h3>
      <p>
        Measles Tracker uses the monthly WHO Measles Surveillance Dataset which
        includes preliminary data on reported measles cases as soon as they are
        available, commonly with a one to two month lag in reporting by member
        states.
        <a
          className={styles.footnoteInline}
          href='#_ftn6'
          name='_ftnref6'
          title=''
        >
          [6]
        </a>{' '}
        Since these data are provisional, a given country may have
        different numbers of reported cases if comparing the sum of all monthly
        WHO surveillance data (as in Measles Tracker) with the annual WHO
        surveillance data reported by WHO member states and verified through the
        WHO/UNICEF Joint Reporting Process (available{' '}
        <a
          target='_blank'
          href='http://www.who.int/entity/immunization/monitoring_surveillance/data/incidence_series.xls?ua=1&ua=1'
        >
          here
        </a>{''}
        ).
        <a
          className={styles.footnoteInline}
          href='#_ftn7'
          name='_ftnref7'
          title=''
        >
          [7]
        </a>{' '}
        This is important to note when comparing data from Measles Tracker to
        other sources.  Data from the WHO/UNICEF Joint Reporting Process are
        only available as a single annual case count and are only made available
        in July of the year following a reporting year (e.g., July 2019 for the
        2018 calendar year).
        <a
          className={styles.footnoteInline}
          href='#_ftn7'
          name='_ftnref7'
          title=''
        >
          [7]
        </a>{' '}
        Since data submitted in the monthly reports are considered provisional,
        many retrospective analyses that do not require the most recent or
        monthly data use the single-value, annual case count provided the
        following year by the release of measles cases from the WHO/UNICEF Joint
        Reporting Process. However, Measles Tracker uses the monthly WHO
        surveillance data as its primary source of measles caseload data
        because it provides information on measles cases at the finest temporal
        resolution and update frequency available publicly, as needed to provide
        information about ongoing outbreaks.
      </p>

      <h3>Crosswalking Joint External Evaluations 1.0 and 2.0</h3>
      <p>
        Joint External Evaluations (JEEs) assess a country’s capacity to
        prevent, detect, and respond to infectious disease threats. Countries
        are assessed across 19 technical areas, each of which is scored based on
        one or more specific indicators that have attributes reflecting various
        levels of capacity. Scores range from one to five, where one indicates{' '}
        <em>no capacity</em> and five indicates <em>sustainable capacity</em>.
        Measles Tracker summarizes country-level capacity based on the average
        of indicator-level scores for the following core capacities related to
        measles prevention, detection, and response:&nbsp;
      </p>

      <ul>
        <li>Immunization</li>
        <li>Real Time Surveillance</li>
        <li>Medical Countermeasures and Personnel Deployment</li>
      </ul>

      <p>
        Two versions of the JEE have been released, a first edition (JEE 1.0)
        released in February 2016 and a second, revised edition (JEE 2.0), with
        revised questions and scoring rules, released in January 2018.
      </p>

      <p>
        As of October 2019, a total of 82 countries have completed JEE 1.0 and
        10 countries have completed JEE 2.0.
        <a
          className={styles.footnoteInline}
          href='#_ftn8'
          name='_ftnref8'
          title=''
        >
          [8]
        </a>{' '}
        To align the scores between the two assessments and enable an “apples to
        apples” comparison of scores, scores from JEE 1.0 must be crosswalked to
        align with scores from JEE 2.0 based on a series of data alignment rules
        documented in Appendix 2 of JEE 2.0.
        <a
          className={styles.footnoteInline}
          href='#_ftn9'
          name='_ftnref9'
          title=''
        >
          [9]
        </a>
      </p>

      <p>
        In the measles dashboard, scores from JEE 2.0 are reported directly,
        while scores from JEE 1.0 are first crosswalked to align with JEE 2.0
        scores based on the scoring rules documented below, derived from
        Appendix 2 of JEE 2.0.
      </p>

      <p>
        <strong>Table 2:</strong> JEE scoring rules for incorporation into the
        Measles Dashboard
      </p>

      <table className={styles.narrow}>
        <thead>
          <tr>
            <td rowspan='2' width='150'>
              <p>
                <strong>Core capacity</strong>
              </p>
            </td>
            <td colspan='2' width='462'>
              <p>
                <strong>Rules for communicating scores</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td width='204'>
              <p>
                <strong>JEE 1.0</strong>
              </p>
            </td>
            <td width='258'>
              <p>
                <strong>JEE 2.0</strong>
              </p>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td width='150'>
              <p>Immunization</p>
            </td>
            <td width='204'>
              <p>Use scores as reported</p>
            </td>
            <td width='258'>
              <p>Use scores as reported</p>
            </td>
          </tr>
          <tr>
            <td width='150'>
              <p>Real-time surveillance</p>
            </td>
            <td width='204'>
              <p>
                Average score of indicator D.2.1 and D.2.4 to estimate indicator
                D.2.1 in JEE 2.0, otherwise interpret other indicators the same
                way
              </p>
            </td>
            <td width='258'>
              <p>Use scores as reported</p>
            </td>
          </tr>
          <tr>
            <td width='150'>
              <p>Medical countermeasures and personnel deployment</p>
            </td>
            <td width='204'>
              <p>Use indicator score for R.2.4 for indicator R.4.3</p>
            </td>
            <td width='258'>
              <p>Use scores as reported</p>
            </td>
          </tr>
        </tbody>
      </table>
      <div className={styles.referencesDivider}>
        <div className={styles.footnote} id='ftn1'>
          <p>
            <a
              className={styles.footnote}
              href='#_ftnref1'
              name='_ftn1'
              title=''
            >
              [1]
            </a>
            <p>
              The World Health Organization recommends administering MCV1
              between 9 and 12 months of age, and MCV2 a minimum of 4 weeks
              after the first dose; however, country-specific vaccination
              strategies vary (e.g., the US recommends vaccinating children with
              MCV1 between 12-15 months of age, and MCV2 between 4-6 years old).
            </p>
          </p>
        </div>
        <div className={styles.footnote} id='ftn2'>
          <p>
            <a
              className={styles.footnote}
              href='#_ftnref2'
              name='_ftn2'
              title=''
            >
              [2]
            </a>
            <p>
              Although the US Centers for Disease Control and Prevention
              considers people protected for life who received both doses of the
              measles vaccine as children, people who received the killed
              measles vaccine between 1963 and 1967 should consider getting
              revaccinated with the current, live attenuated vaccine.
            </p>
          </p>
        </div>
        <div className={styles.footnote} id='ftn3'>
          <p>
            <a
              className={styles.footnote}
              href='#_ftnref3'
              name='_ftn3'
              title=''
            >
              [3]
            </a>
            <p>
              For additional information on incidence rates, please see CDC’s
              Introduction to Applied Epidemiology and Biostatistics, available
              online <i>via</i>{' '}
              <a
                target='_blank'
                href='https://www.cdc.gov/csels/dsepd/ss1978/lesson3/section1.html'
              >
                https://www.cdc.gov/csels/dsepd/ss1978/lesson3/section1.html
              </a>
            </p>
          </p>
        </div>
        <div className={styles.footnote} id='ftn4'>
          <p>
            <a
              className={styles.footnote}
              href='#_ftnref4'
              name='_ftn4'
              title=''
            >
              [4]
            </a>
            <p>
              Countries report data every 1-2 months, and not always at the same
              frequency. In data available from the World Health Organization,
              for the most recent month for which data are available, some
              countries have reported caseload data, and some have not. However,
              the WHO dataset does not distinguish between “data not yet
              reported” and “0 cases reported”. As a result, for the most recent
              month for which data are available, all values of zero are treated
              as “data not yet reported” and therefore a missing value. These
              values will be iteratively updated as new data become available.
              In the site, the most recently available data will be shown, so
              for countries with these missing values indicated for the most
              recent month, caseload data (with appropriate timestamp labels)
              from the prior month will be shown by default until additional
              data become available.
            </p>
          </p>
        </div>
        <div className={styles.footnote} id='ftn5'>
          <p>
            <a
              className={styles.footnote}
              href='#_ftnref5'
              name='_ftn5'
              title=''
            >
              [5]
            </a>
            <p>
              If sources publish data at a finer temporal resolution than
              monthly, they are processed into monthly increments to align with
              the WHO Measles Surveillance dataset.
            </p>
          </p>
        </div>
        <div className={styles.footnote} id='ftn6'>
          <p>
            <a
              className={styles.footnote}
              href='#_ftnref6'
              name='_ftn6'
              title=''
            >
              [6]
            </a>
            <p>
              World Health Organization. Measles and Rubella Surveillance Data.
              Accessed online <i>via</i>{' '}
              <a
                target='_blank'
                href='https://www.who.int/immunization/monitoring_surveillance/burden/vpd/surveillance_type/active/measles_monthlydata/en/'
              >
                https://www.who.int/immunization/monitoring_surveillance/burden/vpd/surveillance_type/active/measles_monthlydata/en/
              </a>
            </p>
          </p>
        </div>
        <div className={styles.footnote} id='ftn7'>
          <p>
            <a
              className={styles.footnote}
              href='#_ftnref7'
              name='_ftn7'
              title=''
            >
              [7]
            </a>
            <p>
              World Health Organization. WHO/UNICEF Joint Reporting Process.
              Accessed online <i>via</i>{' '}
              <a
                target='_blank'
                href='https://www.who.int/immunization/monitoring_surveillance/routine/reporting/en/'
              >
                https://www.who.int/immunization/monitoring_surveillance/routine/reporting/en/
              </a>
            </p>
          </p>
        </div>
        <div className={styles.footnote} id='ftn8'>
          <p>
            <a
              className={styles.footnote}
              href='#_ftnref8'
              name='_ftn8'
              title=''
            >
              [8]
            </a>
            <p>
              World Health Organization. Joint External Evaluation (JEE) mission
              reports. Accessed online <i>via</i>{' '}
              <a
                target='_blank'
                href='https://www.who.int/ihr/procedures/mission-reports/en/'
              >
                https://www.who.int/ihr/procedures/mission-reports/en/
              </a>
            </p>
          </p>
        </div>
        <div className={styles.footnote} id='ftn9'>
          <p>
            <a
              className={styles.footnote}
              href='#_ftnref9'
              name='_ftn9'
              title=''
            >
              [9]
            </a>
            <p>
              World Health Organization. Joint External Evaluation tool (2nd
              edition). Accessed online <i>via</i>{' '}
              <a
                target='_blank'
                href='https://extranet.who.int/sph/joint-external-evaluation-tool-2nd-edition'
              >
                https://extranet.who.int/sph/joint-external-evaluation-tool-2nd-edition
              </a>
            </p>
          </p>
        </div>
      </div>
    </div>
  )
}

export default About
