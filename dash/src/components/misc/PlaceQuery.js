import axios from 'axios'
import Util from './Util.js'

/**
 * Get place data from API. Populates the place menu.
 * when complete.
 */

const PlaceQuery = async function (place_id = null, by_region = false) {
  const params = {
    by_region: by_region,
  };

  if (place_id !== null) params.id = place_id

  const res = await axios(`${Util.API_URL}/places`, {
    params
  });

  return res.data.data
};

export default PlaceQuery;
