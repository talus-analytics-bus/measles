import React from 'react'
import styles from './about.module.scss'

// JSX for about page.
const About = () => {

  return (
    <div className={styles.about}>
    <h1>Overview</h1>
    <p>The Measles Dashboard provides up-to-date information on global measles outbreaks and vaccination coverage to support public health decision making. The dashboard provides access to data visualizations communicating who is vaccinated, where, relative to the status of ongoing outbreaks. Below, we describe the sources of data integrated within the dashboard and the analytical methods used to analyze and communicate those data.</p>
    <h1>Data</h1>
    <h2>Data requirements</h2>
    <p>The Measles Dashboard relies on a set of core data elements that, together, provide an overview of vaccination efforts. Vaccination coverage data define the percent of the population who have been vaccinated for measles. Typically, measles vaccination occurs in a two dose sequence of measles-containing vaccine (MCV), so vaccination coverage can be reported as the percent of the population who have received at least one dose of measles-containing vaccine (MCV1), or the percent of the population who have received two doses of measles-containing vaccine (MCV2).<a class={styles.footnote} href="#_ftn1" name="_ftnref1">[1]</a> This two-dose course of measles is believed to provide lifetime immunity, and booster doses are typically not needed.<a class={styles.footnote} href="#_ftn2" name="_ftnref2">[2]</a> As a result, vaccination coverage data are typically reported on an annual basis, as the majority of vaccination efforts are focused largely on infants.</p>
    <p>Caseload data define the total number of new measles cases in a given geography at a given point in time. These data are reported monthly by the World Health Organization (WHO), and include laboratory confirmed, epidemiologically linked, and/or clinical cases reported to WHO. Based on these available caseload data, it is possible to calculate the monthly incidence rate, or the number of persons newly diagnosed with measles, per 1,000,000 total population, per month.<a class={styles.footnote} href="#_ftn3" name="_ftnref3">[3]</a></p>
    <p>For context on existing public health and economic capacity, and to enable comparisons between countries, vaccination coverage and caseload data msut also be compared alongside other relevant information on a country&rsquo;s current status, including, for example, scores from Joint External Evaluations and country-level GDP data.</p>
    <p>Table 1, below, provides an overview of data sources currently available to meet these requirements. These data sources are described in additional detail in the subsequent sections of this document.</p>
    <p><strong>Table 1:</strong> Sources of data currently displayed in the Measles Dashboard</p>
    <table width="863">
      <thead>
        <tr>
          <td rowspan="2" width="97">
            <p><strong>Data element</strong></p>
          </td>
          <td colspan="7" width="766">
            <p><strong>Information on data source(s) used</strong></p>
          </td>
        </tr>
        <tr>
          <td width="110">
            <p><strong>Source of data</strong></p>
          </td>
          <td width="192">
            <p><strong>Brief description</strong></p>
          </td>
          <td width="77">
            <p><strong>Temporal resolution</strong></p>
          </td>
          <td width="93">
            <p><strong>Geographic resolution</strong></p>
          </td>
          <td width="102">
            <p><strong>Population(s)</strong></p>
          </td>
          <td width="97">
            <p><strong>Most recent available data</strong></p>
          </td>
          <td width="96">
            <p><strong>Update frequency</strong></p>
          </td>
        </tr>
      </thead>
      <tbody>

        <tr>
          <td width="97">
            <p>Vaccination coverage</p>
            <p><em>ages 12-23 months</em></p>
          </td>
          <td width="110">
            <p>WHO/UNICEF Estimates of National Immunization Coverage (WUENIC)</p>
          </td>
          <td width="192">
            <p>Data report yearly vaccination coverage estimates for children ages 12 &ndash; 23 months for all WHO member countries. Data are only available for past years.</p>
          </td>
          <td width="77">
            <p>yearly</p>
          </td>
          <td width="93">
            <p>country</p>
          </td>
          <td width="102">
            <p>ages 12-23 months</p>
          </td>
          <td width="97">
            <p>2018</p>
          </td>
          <td width="96">
            <p>3 times per year (June, July, and December)</p>
          </td>
        </tr>
        <tr>
          <td width="97">
            <p>Measles caseload</p>
            <p><em>Total population</em></p>
          </td>
          <td width="110">
            <p>WHO Measles Surveillance Data</p>
          </td>
          <td width="192">
            <p>Data report the number of new measles cases reported by month for all WHO member countries.</p>
          </td>
          <td width="77">
            <p>monthly</p>
          </td>
          <td width="93">
            <p>country</p>
          </td>
          <td width="102">
            <p>total population</p>
          </td>
          <td width="97">
            <p>August 2019<a class={styles.footnote} href="#_ftn4" name="_ftnref4">[4]</a></p>
          </td>
          <td width="96">
            <p>approximately monthly</p>
          </td>
        </tr>
        <tr>
          <td width="97">
            <p>Total population</p>
          </td>
          <td width="110">
            <p>UN World Population Prospects</p>
          </td>
          <td width="192">
            <p>Data report de facto population estimates and projections for all countries in the world.</p>
          </td>
          <td width="77">
            <p>yearly</p>
          </td>
          <td width="93">
            <p>country</p>
          </td>
          <td width="102">
            <p>total population</p>
          </td>
          <td width="97">
            <p>2019</p>
          </td>
          <td width="96">
            <p>every two years</p>
          </td>
        </tr>
        <tr>
          <td width="97">
            <p>GDP per capita</p>
          </td>
          <td width="110">
            <p>World Bank GDP per capita data</p>
          </td>
          <td width="192">
            <p>Data report GDP per capita (in current US$ currency) for 195 countries from 1960 through 2018.<a class={styles.footnote} href="#_ftn5" name="_ftnref5">[5]</a></p>
          </td>
          <td width="77">
            <p>yearly</p>
          </td>
          <td width="93">
            <p>country</p>
          </td>
          <td width="102">
            <p>total population</p>
          </td>
          <td width="97">
            <p>2018</p>
          </td>
          <td width="96">
            <p>not reported by World Bank</p>
          </td>
        </tr>
        <tr>
          <td width="97">
            <p>Country capacity</p>
            <p><em>select JEE scores</em></p>
          </td>
          <td width="110">
            <p>Joint External Evaluation (JEE) scores</p>
          </td>
          <td width="192">
            <p>The JEE measures country specific progress in developing capacities to prevent, detect, and rapidly respond to public health risks.</p>
          </td>
          <td width="77">
            <p>one-time observation per country</p>
          </td>
          <td width="93">
            <p>country</p>
          </td>
          <td width="102">
            <p>total population</p>
          </td>
          <td width="97">
            <p>August 2019</p>
          </td>
          <td width="96">
            <p>updated on a rolling basis</p>
          </td>
        </tr>
      </tbody>
    </table>
    <h2>Data analysis, processing, and integration</h2>
    <h3>Calculating monthly incidence rates</h3>
    <p>Monthly incidence rates for the total population are estimated as the number of new measles cases in the most recent month for which data are available divided by the total population size. These data are reported as the number of cases per 1,000,000 total population per month, and are calculated using measles caseload data from WHO and population demographic data from the UN World Population Prospects.</p>
    <h3>Quantifying increase and decrease in monthly caseload</h3>
    <p>Available caseload data report the number of new cases per country, per month. An outbreak is indicated as &ldquo;increasing&rdquo; if the number of new cases in the most recent month for which data are available is greater than the number of new cases in the prior month. The percent change in new cases from month to month is calculated as the difference in the total number of new cases between the current month and the prior month, divided by the total number of new cases in the prior month.</p>
    <h3>Addressing missing (or not-yet reported) caseload data</h3>
    <p>Countries report caseload data to the World Health Organization every 1-2 months, and not always at the same frequency. In data available from the World Health Organization, for the most recent month for which data are available, some countries have reported caseload data, and some have not. However, the WHO dataset does not distinguish between &ldquo;data not yet reported&rdquo; and &ldquo;0 cases reported&rdquo;. As a result, for the most recent month for which data are available, all values of zero are treated as &ldquo;data not yet reported&rdquo; and therefore a missing value. These values will be iteratively updated as new data become available. In the site, the most recently available data will be shown, so for countries with these missing values indicated for the most recent month, caseload data (with appropriate timestamp labels) from the prior month will be shown by default until additional data become available.</p>
    <p>As of October 2019, the WHO Measles Surveillance Dataset contains no caseload data for Algeria or Ecuador for the year 2019. As a result, caseload data cannot be shown for these countries.</p>
    <h3>Crosswalking Joint External Evaluations 1.0 and 2.0</h3>
    <p>Joint External Evaluations (JEEs) assess a country&rsquo;s capacity to prevent, detect, and respond to infectious disease threats. Countries are assessed across 19 technical areas, each of which is scored based on one or more specific indicators that have attributes reflecting various levels of capacity. Scores range from one to five, where one indicates <em>no capacity</em> and five indicates <em>sustainable capacity</em>. The Measles Dashboard summarizes country-level capacity based on the average of indicator-level scores for the following core capacities related to measles prevention, detection, and response:</p>
    <ul>
      <li>Immunization</li>
      <li>Real Time Surveillance</li>
      <li>Medical Countermeasures and Personnel Deployment</li>
    </ul>
    <p>Two versions of the JEE have been released, a first edition (JEE 1.0) released in February 2016 and a second, revised edition (JEE 2.0), with revised questions and scoring rules, released in January 2018.</p>
    <p>As of October 2019, a total of 82 countries have completed JEE 1.0 and 10 countries have completed JEE 2.0.<a class={styles.footnote} href="#_ftn6" name="_ftnref6">[6]</a> To align the scores between the two assessments and enable an &ldquo;apples to apples&rdquo; comparison of scores, scores from JEE 1.0 must be crosswalked to align with scores from JEE 2.0 based on a series of data alignment rules documented in Appendix 2 of JEE 2.0.<a class={styles.footnote} href="#_ftn7" name="_ftnref7">[7]</a></p>
    <p>In the measles dashboard, scores from JEE 2.0 are reported directly, while scores from JEE 1.0 are first crosswalked to align with JEE 2.0 scores based on the scoring rules documented below, derived from Appendix 2 of JEE 2.0.</p>
    <p><strong>Table 2:</strong> JEE scoring rules for incorporation into the Measles Dashboard</p>
    <table className={styles.narrow}>
      <thead>
        <tr>
          <td rowspan="2" width="150">
            <p><strong>Core capacity</strong></p>
          </td>
          <td colspan="2" width="462">
            <p><strong>Rules for communicating scores</strong></p>
          </td>
        </tr>
        <tr>
          <td width="204">
            <p><strong>JEE 1.0</strong></p>
          </td>
          <td width="258">
            <p><strong>JEE 2.0</strong></p>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td width="150">
            <p>Immunization</p>
          </td>
          <td width="204">
            <p>Use scores as reported</p>
          </td>
          <td width="258">
            <p>Use scores as reported</p>
          </td>
        </tr>
        <tr>
          <td width="150">
            <p>Real-time surveillance</p>
          </td>
          <td width="204">
            <p>Average score of indicator D.2.1 and D.2.4 to estimate indicator D.2.1 in JEE 2.0, otherwise interpret other indicators the same way</p>
          </td>
          <td width="258">
            <p>Use scores as reported</p>
          </td>
        </tr>
        <tr>
          <td width="150">
            <p>Medical countermeasures and personnel deployment</p>
          </td>
          <td width="204">
            <p>Use indicator score for R.2.4 for indicator R.4.3</p>
          </td>
          <td width="258">
            <p>Use scores as reported</p>
          </td>
        </tr>
      </tbody>
    </table>
    <div className={styles.referencesDivider}>
      <p><a class={styles.footnote} href="" name="_ftn1">[1]</a><div className={styles.footnoteText}> The World Health Organization recommends administering MCV1 between 9 and 12 months of age, and MCV2 a minimum of 4 weeks after the first dose; however, country-specific vaccination strategies vary (e.g., the US recommends vaccinating children with MCV1 between 12-15 months of age, and MCV2 between 4-6 years old).</div></p>
      <p><a class={styles.footnote} href="" name="_ftn2">[2]</a><div className={styles.footnoteText}> Although the US Centers for Disease Control and Prevention considers people protected for life who received both doses of the measles vaccine as children, people who received the killed measles vaccine between 1963 and 1967 should consider getting revaccinated with the current, live attenuated vaccine.</div></p>
      <p><a class={styles.footnote} href="" name="_ftn3">[3]</a><div className={styles.footnoteText}> For additional information on incidence rates, please see CDC&rsquo;s Introduction to Applied Epidemiology and Biostatistics, available online <i>via</i> <a target="_blank" href="https://www.cdc.gov/csels/dsepd/ss1978/lesson3/section1.html">https://www.cdc.gov/csels/dsepd/ss1978/lesson3/section1.html</a></div></p>
      <p><a class={styles.footnote} href="" name="_ftn4">[4]</a><div className={styles.footnoteText}> Countries report data every 1-2 months, and not always at the same frequency. In data available from the World Health Organization, for the most recent month for which data are available, some countries have reported caseload data, and some have not. However, the WHO dataset does not distinguish between &ldquo;data not yet reported&rdquo; and &ldquo;0 cases reported&rdquo;. As a result, for the most recent month for which data are available, all values of zero are treated as &ldquo;data not yet reported&rdquo; and therefore a missing value. These values will be iteratively updated as new data become available. In the site, the most recently available data will be shown, so for countries with these missing values indicated for the most recent month, caseload data (with appropriate timestamp labels) from the prior month will be shown by default until additional data become available.</div></p>
      <p><a class={styles.footnote} href="" name="_ftn5">[5]</a><div className={styles.footnoteText}> In the dashboard, GDP per capita data are rounded to the nearest one-tenth (one decimal point), equivalent to the way that data are graphically presented on the World Bank website.</div></p>
      <p><a class={styles.footnote} href="" name="_ftn6">[6]</a><div className={styles.footnoteText}> World Health Organization. Joint External Evaluation (JEE) mission reports.&nbsp; Accessed online <i>via</i> <a target="_blank" href="https://www.who.int/ihr/procedures/mission-reports/en/">https://www.who.int/ihr/procedures/mission-reports/en/</a></div></p>
      <p><a class={styles.footnote} href="" name="_ftn7">[7]</a><div className={styles.footnoteText}> World Health Organization. Joint External Evaluation tool (2nd edition). Accessed online <i>via</i> <a target="_blank" href="https://extranet.who.int/sph/joint-external-evaluation-tool-2nd-edition">https://extranet.who.int/sph/joint-external-evaluation-tool-2nd-edition</a></div></p>
    </div>
    </div>
  )
}

export default About
