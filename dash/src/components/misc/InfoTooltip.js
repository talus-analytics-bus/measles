import React from 'react';
import { renderToString } from 'react-dom/server'
import imgSrc from '../../assets/images/info.svg';
import styles from './infotooltip.module.scss';

/**
 * Generic info tooltip
 * @method InfoTooltip
 */
const InfoTooltip = (props) => {
  const dataHtml = renderToString(props.text);
  return (
    <div
      className={styles.infoTooltip}
      data-for={'infoTooltip'}
      data-html={true}
      data-tip={dataHtml}
    >
      <img src={imgSrc} />
    </div>
  );
};

export default InfoTooltip;
