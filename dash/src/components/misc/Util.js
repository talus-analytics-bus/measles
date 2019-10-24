import * as d3 from 'd3/dist/d3.min';

// Utility functions.
const Util = {};

Util.getScatterLabelData = (datum) => {
  switch (datum.metric) {
    case 'caseload_totalpop':
      return 'Measles cases reported';
    case 'incidence_monthly':
      return 'Monthly incidence of measles';
    default:
      return '';
  }
};

Util.getSvgChartLabelData = (datum) => {
  switch (datum.metric) {
    case 'caseload_totalpop':
      return [
        'Cases reported',
      ];
    case 'incidence_monthly': // DEBUG
      return [
        'Global yearly',
        'incidence',
      ];
    default: // DEBUG
      return [
        'Global vaccination',
        'coverage',
      ];
  }
};

Util.getUTCDate = (dt) => {
  const utcYear = dt.getUTCFullYear();
  const utcMonth = dt.getUTCMonth();
  const utcDt = new Date(`${utcYear}/${utcMonth + 1}/1`);
  return utcDt;
};

Util.getTooltipItem = (datum) => {
  switch (datum.metric) {
    case 'caseload_totalpop':
      return {
        name: 'Cases reported',
        datum: datum,
        period: 'month',
        value: Util.comma(datum.value),
        label: 'cases',
      };
    case 'incidence_monthly': // DEBUG
      return {
        name: 'Monthly incidence',
        datum: datum,
        period: 'month',
        value: Util.formatIncidence(datum.value),
        label: 'cases per 1M population',
      };
    case 'coverage_mcv1_infant': // DEBUG
      return {
        name: 'Vaccination coverage',
        datum: datum,
        period: 'year',
        value: Util.percentize(datum.value),
        label: 'of infants',
      };
    case 'total_population':
      return {
        name: 'Total population',
        datum: datum,
        period: 'year',
        value: Util.formatSI(datum.value),
        label: 'people',
      };
  }
};

Util.quantiles = [
  {
    name: 'Very low',
    value: 0.2,
  },
  {
    name: 'Low',
    value: 0.6,
  },
  {
    name: 'Average',
    value: 1.4,
  },
  {
    name: 'High',
    value: 4.1,
  },
];

// const getIncidenceQuantile = (allObsTmp, countryObs) => {
Util.getIncidenceQuantile = (countryObs, params = {}) => {

  if (countryObs.value === 0) {
    if (params.type === 'name') return '';
    return -9999;
  }

  for (let i = 0; i < Util.quantiles.length; i++) {
    if (countryObs.value < Util.quantiles[i].value) {
      if (params.type === 'name') return Util.quantiles[i].name;
      else return i;
    } else if (i === Util.quantiles.length - 1 && countryObs.value >= Util.quantiles[i].value) {
      if (params.type === 'name') return 'Very high';
      return (i + 1);
    }
  }
  return null;

  // const allObs = allObsTmp.filter(o => {
  //   return o.value && o.value !== null && o.value > 0;
  // })
  // .map(o => o.value)
  // .sort();
  //
  // const quartiles = [
  //   d3.quantile(allObs, .25),
  //   d3.quantile(allObs, .5),
  //   d3.quantile(allObs, .75),
  // ];
  //
  //
  // if (countryObs.value < quartiles[0]) {
  //   return 0;
  // }
  // else if (countryObs.value < quartiles[1]) {
  //   return 1;
  // }
  // else if (countryObs.value < quartiles[2]) {
  //   return 2;
  // }
  // else if (countryObs.value >= quartiles[2]) {
  //   return 3;
  // } else return null;
};

const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    if (window.location.href.search('https') > -1) return 'https://measles-api.talusanalytics.com';
    else return 'http://measles-api-dev.us-west-1.elasticbeanstalk.com/';
  } else return 'http://localhost:5002';
};

Util.API_URL = getApiUrl();

Util.getDateTimeRange = (item) => {
  const data = item.value;
  if (data === null) return '';
  const first = data[0]['date_time'];
  const last = data[data.length - 1]['date_time'];
  const firstStr = new Date(first.replace(/-/g, '/')).toLocaleString('en-us', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const lastStr = new Date(last.replace(/-/g, '/')).toLocaleString('en-us', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  if (firstStr === lastStr) return `(${firstStr})`;
  else return `(${firstStr} to ${lastStr})`;
};

Util.formatDatetimeApi = (dt) => {
  const year = dt.getFullYear();
  const monthTmp = dt.getMonth() + 1;
  const month = monthTmp > 9 ? ('' + monthTmp) : ('0' + monthTmp);

  const dateTmp = dt.getDate();
  const date = dateTmp > 9 ? ('' + dateTmp) : ('0' + dateTmp);

  // const hoursTmp = dt.getHours();
  // const hours = hoursTmp > 9 ? ('' + hoursTmp) : ('0' + hoursTmp);
  //
  // const minutesTmp = dt.getMinutes();
  // const minutes = minutesTmp > 9 ? ('' + minutesTmp) : ('0' + minutesTmp);
  //
  // const secondsTmp = dt.getSeconds();
  // const seconds = secondsTmp > 9 ? ('' + secondsTmp) : ('0' + secondsTmp);

  const yyyymmdd = `${year}-${month}-${date}`;
  return `${yyyymmdd}`;
  // const hhmmss = `${hours}:${minutes}:${seconds}`;
  // return `${yyyymmdd}T${hhmmss}`;
};

Util.today = () => {
  return new Date(); // TODO put time traveling here if needed
};

Util.getDatetimeStamp = (datum, type = 'year') => {
  if (!datum || datum['value'] === null) return '';

  let datetimeStamp;
  const date_time = datum['date_time'].replace(/-/g, '/');
  if (type === 'month') {
    datetimeStamp = new Date(date_time).toLocaleString('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } else if (type === 'year') {
    datetimeStamp = new Date(date_time).toLocaleString('en-US', {
      year: 'numeric',
      timeZone: 'UTC',
    });
  }
  return ` (${datetimeStamp})`;
};

Util.importAll = (r) => {
  let images = {};
  r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
  return images;
}

// Sorting functions to sort alerts and statuses data by datetime and by
// unique ID (sequential relative to submission order).
Util.sortByDatetime = (a, b) => {
  const dateA = new Date(a.effective_dtm);
  const dateB = new Date(b.effective_dtm);
  if (dateA > dateB) return -1;
  if (dateA < dateB) return 1;
  return 0;
};
Util.sortByAlertId = (a, b) => {
  if (a.alert_id > b.alert_id) return -1;
  if (a.alert_id < b.alert_id) return 1;
  return 0;
};
Util.sortByDetailsId = (a, b) => {
  if (a.details_id > b.details_id) return -1;
  if (a.details_id < b.details_id) return 1;
  return 0;
};
Util.sortByName = (a, b) => {
  if (a.name > b.name) return -1;
  if (a.name < b.name) return 1;
  return 0;
};
Util.sortByField = (field) => {
  return (a, b) => {
    if (a[field] > b[field]) return -1;
    if (a[field] < b[field]) return 1;
    return 0;
  };
};

// Percentize number
Util.percentize = (val) => {
  return parseFloat(val).toFixed(0) + "%";
};

// Format delta value
Util.percentizeDelta = (deltaTmp) => {
  const delta = Math.abs(deltaTmp);
	const d3Format = d3.format(',.0%');
	const d3FormattedNum = d3Format(delta);

  if (Math.abs(delta) > 2) return '>200%';

	if (d3FormattedNum === "0%" && delta !== 0) {
		return "<1%";
	} else {
		return d3FormattedNum;
	}
};

// Format incidence value
Util.formatIncidence = (inc) => {
  if (inc === 0) return '0';
  else if (inc < 0.001) return '<0.001';
  else return Util.formatSI(inc);
};

// Comma-ize numbers
Util.comma = function(num) {
	const resultTmp = d3.format(',.0f')(num);
	return resultTmp;
};

// Format money as comma number with USD suffix
Util.money = (val) => {
  return Util.comma(val);
}

// Format using standard suffixes
Util.formatSI = (val) => {

  // If zero, just return zero
  if (val === 0) return '0';

  // If 1 or less, return the value with three significant digits. (?)
  else if (val < 1) return d3.format('.3f')(val);

  // If between 1 - 1000, return value with two significant digits.
  else if (val >= 1 && val < 1000) return d3.formatPrefix('.2f', 1)(val); // k

  // If 1k or above, return SI value with two significant digits
  else if (val >= 1000 && val < 1000000) return d3.formatPrefix('.2f', 1000)(val); // k

  // If 1k or above, return SI value with two significant digits
  else if (val >= 1000000 && val < 1000000000) return d3.formatPrefix('.2f', 1000000)(val); // M

  else return d3.formatPrefix(',.2s', 1000000000)(val).replace(/G/,"B"); // B
};

/**
 * Capitalizes each word in the input text and returns the result.
 * @method toTitleCase
 * @param  {[string]}    str [Input string.]
 * @return {[string]}        [Capitalized input string]
 */
Util.toTitleCase = (str) => {
  return str.replace(/\w\S*/g, function(txt){
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Formatting functions for dates and datetimes.
Util.formatDatetime = (input) => {
    return input.toLocaleString('en-us', {
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      year: 'numeric',
      day: 'numeric'
    }
  );
}
Util.formatDate = (input) => {
    return input.toLocaleString('en-us', {
      month: 'short',
      year: 'numeric',
      day: 'numeric'
    }
  );
}

export default Util;
