import React from 'react'
import Map from '../../map/Map'
import Popup from "reactjs-popup";

import styles from './alerts.module.scss'

// type facility = {
//   facility_id: number
//   name: string
//   type: string
//   capacity: number
//   capacity_unit: string
//   address: string
//   city: string
//   state: string
//   zip: number
//   telephone: string
//   latitude: number
//   longitude: number
// }
// type propTypes = {
//   facilities: facility[]
// }
//

const Alerts = props => {
  // Hide the "How to use this map" modal if it has already been displayed
  // once to the user.
  const shownMapModal = props.shownMapModal;

  // Track the types of facilities that are allowed to be displayed on the map
  // and counted in the bar chart.
  const [mappedFacilityTypes, setMappedFacilityTypes] =
    React.useState(['Hospital', 'Dialysis Facility', 'Nursing Home'])

  return (
    <div className={styles.alerts}>
      <Popup

        // Class name for styling (found in index.scss).
        className={'mapModal'}

        // Don't open the modal if it's already been shown.
        defaultOpen={!shownMapModal}

        // This is a modal.
        modal

        // When popup is closed, update state variable in App so it doesn't
        // get shown again this session.
        onClose={
          () => {
            props.setShownMapModal(true);
          }
        }
      >
        {
          close => (
          <div className={styles.modal}>
            <a className={styles.close} onClick={close}>
              &times;
            </a>
            <div className={styles.header}>How to use this map</div>
            <div className={styles.content}>
              {" "}
              This map includes state and facility-level data.
              <ul>
                <li>Click and drag to move the map</li>
                <li>Scroll or use map controls to zoom in/out</li>
                <li>Click state to view state summary</li>
                <li>Click bubbles to zoom closer to individual facilities</li>
                <li>Once zoomed in, click facility icon (H, N, D) to view facility summary</li>
              </ul>
            </div>
            <div className={styles.actions}>
              <button
                className={styles.button}
                onClick={() => {
                  close();
                }}
              >
                OK
              </button>
            </div>
          </div>
        )
      }
      </Popup>
      <Map {...props} mappedFacilityTypes={mappedFacilityTypes} setMappedFacilityTypes={setMappedFacilityTypes} />
    </div>
  )
}
export default Alerts
