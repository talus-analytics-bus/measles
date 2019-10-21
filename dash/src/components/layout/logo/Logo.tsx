import React from 'react'
import classNames from 'classnames'
import { Link } from 'react-router-dom'
import styles from './logo.module.scss'
import Util from '../../../components/misc/Util.js'
import logo from '../../../assets/images/measles_tracker.svg'
import iconPin from '../../../assets/images/pin.svg'
import iconFlag from '../../../assets/images/flag.svg'
import iconGlobe from '../../../assets/images/globe.svg'
import Popup from 'reactjs-popup'
// import ReactTooltip from 'react-tooltip';

const Logo: React.FC = (props: any) => {
  const page = props.page;

  // Track whether the country picker menu is being shown.
  const [showLocationPicker, setShowLocationPicker] = React.useState(false);

  /**
   * Return JSX for country picker menu that opens when you click the flag icon
   * @method renderCountryPicker
   */
  const renderLocationPicker = () => {
    return (
      <div className={classNames(styles.locationPicker, { [styles.visible]: showLocationPicker })}>
        <div className={styles.header}>
          Countries by region
        </div>
        <div className={styles.content}>
          {
            // Region list
          }
        </div>
      </div>
    );
  };

  const renderButton = (button: any) => {
    if (button.route) {
      return (
        <Link to={button.route} className={classNames(page === button.page ? styles.active : '', styles.navButtonContainer)}>
          <div className={classNames(styles.buttonSpinner)}></div>
          <div className={styles.navButton}>
            <img src={button.icon} />
          </div>
        </Link>
      )

    // If no route, then it's the country picker
    } else {

      return (
        <div className={classNames(styles.navButtonContainer, page === button.page ? styles.active : '')}>
          <div className={classNames(styles.buttonSpinner)}></div>
          {renderLocationPicker()}
          <div onClick={() => setShowLocationPicker(!showLocationPicker)} className={classNames(styles.navButton)}>
            <img src={button.icon} />
          </div>
        </div>
      );
      // return (
      //   <Popup
      //     closeOnDocumentClick={true}
      //     modal
      //     trigger={

      //     }
      //   >
      //     <div className={'dev'}>The country menu is currently being developed.</div>
      //   </Popup>
      // );
    }
  };
  const renderButtonSpinner = () => {
      return (
        <div className={styles.buttonSpinner}>
        </div>
      )
  };

  const getPageTitle = (page: any) => {
    switch (page) {
      case 'map':
        return 'Vaccination coverage and incidence of measles';
      default:
        return ''; // TODO check this. Should we show the same for each page?
    }
  };

  const getPageSubtitle = (page: any) => {
    switch (page) {
      case 'map':
        return 'Showing most recent data as of ' + Util.today().toLocaleString('en-US', {
          month: 'short',
          year: 'numeric',
          day: 'numeric',
          timeZone: 'UTC',
        });
      default:
        return ''; // TODO check this. Should we show the same for each page?
    }
  };

  return (
    <div className={classNames(styles.logo, {[styles.loading]: props.loadingNav }, styles[page])}>
      <Link to="/map">
        <img src={logo} className={styles.img} alt='logo' />
      </Link>
      <div className={styles.text}>
        <div className={styles.title}>{getPageTitle(page)}</div>
        {
          <div className={styles.subtitle}>{getPageSubtitle(page)}</div>
        }
      </div>
      <div className={styles.navButtons}>
        {
          [
            {
              id: 'pin',
              page: 'map',
              route: '/map', // TODO rename
              icon: iconPin,
              tooltip: 'Click to view map of vaccination coverage and incidence of measles',
            },
            {
              id: 'flag',
              page: 'details',
              icon: iconFlag,
              popup: true,
              tooltip: 'Click to view map of vaccination coverage and incidence of measles',
            },

            {
              id: 'globe',
              page: 'global',
              route: '/global', // TODO rename
              icon: iconGlobe,
              tooltip: 'Click to view map of vaccination coverage and incidence of measles',
            },
          ].map(button => renderButton(button))
        }
      </div>
    </div>
  )
}

export default Logo
