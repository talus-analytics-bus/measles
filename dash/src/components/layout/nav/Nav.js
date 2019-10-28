import React from 'react'
import classNames from 'classnames'
import { Link } from 'react-router-dom'
import styles from './nav.module.scss'
import Util from '../../../components/misc/Util.js'
import logo from '../../../assets/images/measles_tracker.svg'
import iconPin from '../../../assets/images/pin.svg'
import iconFlag from '../../../assets/images/flag.svg'
import iconGlobe from '../../../assets/images/globe.svg'
import iconPage from '../../../assets/images/page.svg'
import ReactTooltip from 'react-tooltip'

const Nav = (props) => {
  const page = props.page;

  // Track whether the country picker menu is being shown.
  const [showLocationPicker, setShowLocationPicker] = React.useState(false);

  function countryOnClick (e) {
    setShowLocationPicker(false);
    ReactTooltip.rebuild();
  }

  document.getElementById('root').onclick = (e) => {
    const navButtons = document.getElementsByClassName(styles.navButtonContainer)[1]; // TODO elegantly
    if (navButtons && navButtons.contains(e.target)) return;
    else {
      setShowLocationPicker(false);
    }
  };

  const getCountryMenuPosition = (pos, currentEvent, currentTarget, node, place, desiredPlace, effect, offset) => {
    const top = pos.top < 0 ? 0 : pos.top;
    return ({left: 'unset', top: top})
  }

  const renderCountryPicker = (regionName) => {

    if (regionName === null) return;
    if (showLocationPicker) document.getElementById('regionTooltip').scrollTop = 0;
    let curCountry = -9999;
    if (window.location.pathname.startsWith('/details'))
      curCountry = +window.location.pathname.split('/')[2];
    return (
      props.places.find(p => p.name === regionName).data.map((c) =>
        <Link onClick={countryOnClick} className={classNames(styles.country, {[styles.active]: c[0] === curCountry})} to={`/details/${c[0]}`}>
            {c[1]}
        </Link>
      )
    );
  };

  React.useEffect(() => {
    ReactTooltip.hide();
  })

  /**
   * Callback for when a region is clicked in the menu.
   */
  function regionOnClick (e) {
    // get region el
    let el;
    if (e.target === undefined) return;
    if (e.target.classList.contains(styles.region)) {
      el = e.target;
    } else {
      el = e.target.parentElement;
    }

    // if active: close country menu and deactivate.
    if (el.classList.contains(styles.activeRegion)) {

      // Remove active class
      el.classList.remove(styles.activeRegion);

      return;
    } else {

      // Remove active class from other region if there is one
      const activeEls = document.getElementsByClassName(styles.activeRegion);
      for (let i = 0; i < activeEls.length; i++) {
        activeEls[i].classList.remove(styles.activeRegion);
        if (activeEls[i] && activeEls[i].attributes.currentitem  === true) {
          ReactTooltip.hide(activeEls[i])
        }
      }

      // Add active class to current region
      el.classList.add(styles.activeRegion);
      return
    }
  };

  const afterTooltipHide = () => {
    const regionEls = document.getElementsByClassName(styles.region);
    for (let i = 0; i < regionEls.length; i++) {
      const el = regionEls[i];
      el.setAttribute('currentitem', false);
    }
  }

  /**
   * Return JSX for country picker menu that opens when you click the flag icon
   * @method renderCountryPicker
   */
  const renderLocationPicker = () => {
    if (props.places.length === 0) return <div className={classNames(styles.locationPicker, { [styles.visible]: showLocationPicker })} />
    return (
      <div className={classNames(styles.locationPicker, { [styles.visible]: showLocationPicker })}>
        <div className={styles.header}>
          Countries by region
        </div>
        <div className={styles.content}>
          {
            props.places.map((p) =>
              <div className={styles.regionContainer}>
                <div className={styles.region} data-tip={p.name} data-for='regionTooltip'>
                  <span>{p.name}</span>
                </div>
              </div>
            )
          }
          {
            <ReactTooltip
              id={'regionTooltip'}
              type='regionTooltip'
              className={styles.regionTooltip}
              place="left"
              event="click"
              clickable={true}
              scrollHide={false}
              resizeHide={false}
              afterHide={afterTooltipHide}
              overridePosition={getCountryMenuPosition}
              getContent={ renderCountryPicker }
            />
          }
        </div>
        <div>
        {

        }
        </div>
      </div>
    );
  };

  const renderButton = (button) => {
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
          <div onClick={(e) => { setShowLocationPicker(!showLocationPicker); e.stopPropagation(); return false; }} className={classNames(styles.navButton)}>
            <img src={button.icon} />
          </div>
        </div>
      );
    }
  };
  const renderButtonSpinner = () => {
      return (
        <div className={styles.buttonSpinner}>
        </div>
      )
  };

  const getPageTitle = (page) => {
    switch (page) {
      case 'map':
        return 'Vaccination coverage and incidence of measles';
      default:
        return ''; // TODO check this. Should we show the same for each page?
    }
  };

  const getPageSubtitle = (page) => {
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
    <div className={classNames(styles.nav, {[styles.loading]: props.loadingNav }, styles[page])}>
      <Link to="/map">
        <img src={logo} className={styles.img} alt='logo' />
      </Link>
      <div className={styles.text}>
        <div className={styles.title}>{getPageTitle(page)}</div>
        {
          <div className={styles.subtitle}>{getPageSubtitle(page)}</div>
        }
      </div>
      <div className={styles.navButtons} id={'navButtons'}>
        {
          [
            {
              id: 'pin',
              page: 'map',
              route: '/map',
              icon: iconPin,
              tooltip: 'Outbreak map',
            },
            {
              id: 'flag',
              page: 'details',
              icon: iconFlag,
              popup: true,
              tooltip: 'Country details',
            },
            {
              id: 'globe',
              page: 'global',
              route: '/global',
              icon: iconGlobe,
              tooltip: 'Global comparisons',
            },
            {
              id: 'page',
              page: 'about',
              route: '/about',
              icon: iconPage,
              tooltip: 'About Measles Tracker',
            },
          ].map(button => renderButton(button))
        }
      </div>
    </div>
  )
}

export default Nav
