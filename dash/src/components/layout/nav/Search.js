import React from 'react'
import classNames from 'classnames'
import styles from './search.module.scss'

const Search = (props) => {

  const [value, setValue] = React.useState('');

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

      const results = [e.target.value]; // TODO
      props.setSearchResults(results);
    }
  };

  const handleKeyPress = (e) => {
    console.log('e.key')
    console.log(e.key)
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
          onKeyDown={handleKeyPress}
        />
      </div>
    </div>
  );
}

export default Search
