import React from 'react'
import classNames from 'classnames'
import styles from './search.module.scss'

const Search = (props) => {
  return (
    <div className={styles.search}>
      <div className={styles.field}>
        <i className={classNames('material-icons')}>search</i>
        <input
          type="text"
          placeholder="type country name..."
        />
      </div>
    </div>
  );
}

export default Search
