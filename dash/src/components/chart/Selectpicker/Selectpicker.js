import React from 'react';
import classNames from 'classnames';
import styles from './selectpicker.module.scss';
import Util from '../../misc/Util.js';

/**
 * Select picker that sets an option from a list.
 * Default is none.
 * @method Selectpicker
 */
const Selectpicker = ({setOption, optionList, allOption, ...props}) => {

  const handleChange = e => {
    setOption(e.target.value);
  };
  return (
    <div className={styles.selectpicker}>
    <select onChange={handleChange} name="pagingBarOptions">
      {
        allOption && <option value="all">{allOption}</option>
      }
      {
        optionList.map(o =>
          <option value={o}>{o}</option>
        )
      }
    </select>
    </div>
  );
};

export default Selectpicker;
