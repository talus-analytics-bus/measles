import * as d3 from 'd3/dist/d3.min';

// Utility functions.
const Util = {};

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
      month: 'long',
      year: 'numeric',
      day: 'numeric'
    }
  );
}
Util.formatDatetimeApi = (dt) => {
  const year = dt.getFullYear();
  const monthTmp = dt.getMonth() + 1;
  const month = monthTmp > 10 ? ('' + monthTmp) : ('0' + monthTmp);
  const dateTmp = dt.getDate();
  const date = dateTmp > 10 ? ('' + dateTmp) : ('0' + dateTmp);
  const hoursTmp = dt.getHours();
  const hours = hoursTmp > 10 ? ('' + hoursTmp) : ('0' + hoursTmp);
  const minutesTmp = dt.getMinutes();
  const minutes = minutesTmp > 10 ? ('' + minutesTmp) : ('0' + minutesTmp);
  const secondsTmp = dt.getSeconds();
  const seconds = secondsTmp > 10 ? ('' + secondsTmp) : ('0' + secondsTmp);
  const yyyymmdd = `${year}-${month}-${date}`;
  const hhmmss = `${hours}:${minutes}:${seconds}`;
  return `${yyyymmdd}T${hhmmss}`;
};

export default Util;
