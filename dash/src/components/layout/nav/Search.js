import React from 'react'
import classNames from 'classnames'
import styles from './search.module.scss'
import FuzzySearch from 'fuzzy-search';

const Search = (props) => {

  const [value, setValue] = React.useState('');

  // Searcher
  // const people = [{
  //   name: {
  //     firstName: 'Jesse',
  //     lastName: 'Bowen',
  //   },
  //   state: 'Seattle',
  // }];

  let countriesTmp = [];
  props.places.forEach(region => {
    countriesTmp = countriesTmp.concat(region.data);
  });
  const countries = countriesTmp.map(c => {
    return {
      name: c[1],
      id: c[0],
    }
  });

  const searcher = new FuzzySearch(countries, ['name'], {
    caseSensitive: false,
  });

  const handleInputChange = (e) => {
    const val = e.target.value;
    // If no value, show region list.
    if (val === '') {
      props.setSearchResults(null);
      return;
    }
    else {

      // Find country matches
      // Return them by setting the country values
      const results = searcher.search(val).slice(0, 5);
      props.setSearchResults(results);
    }
  };

  const handleKeyPress = (e) => {
    if (e.keyCode === 27) {
      e.target.value = '';
      props.setSearchResults(null);
    }
  };

  return (
    <div className={styles.search}>
      <div className={styles.field}>
        <i className={classNames('material-icons')}>search</i>
        <input
          type="text"
          placeholder="type country name..."
          onChange={handleInputChange}
          onKeyDown ={handleKeyPress}
        />
      </div>
    </div>
  );
}

export default Search
