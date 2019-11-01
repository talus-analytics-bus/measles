import React from 'react';
import imgSrc from '../../assets/images/info.svg';
import styles from './infotooltip.module.scss';

/**
 * Generic info tooltip
 * @method InfoTooltip
 */
const InfoTooltip = (props) => {
  return (
    <div
      className={styles.infoTooltip}
      data-for={'infoTooltip'}
      data-tip={props.text}
    >
      <img src={imgSrc} />
    </div>
  );
};

export default InfoTooltip;
