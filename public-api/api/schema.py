##
# # API schema
##

# Standard libraries
import functools
from datetime import datetime, date

# Third party libraries
from pony.orm import select

# Local libraries
from .models import db


# Cache responses for API requests that have previously been made so that the
# computation does not need to be repeated.
def cached(func):

    # Cache initially blank.
    cache = {}

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # Get the key corresponding to the request
        key = str(kwargs)

        # If the request has been made before
        if key in cache:

            # Return the cached data for the response to the request
            return cache[key]

        # Otherwise
        # After the request is done, take the results and cache them for next
        # time
        results = func(*args, **kwargs)
        cache[key] = results
        return results

    # Return the function wrapper (for decoration)
    return wrapper


# Define a metric endpoint query.
def getMetrics(filters):

    # Initialize response as empty
    res = None

    # If id param is not in the filters (query params), then return all people
    if 'id' not in filters:
        res = select(m for m in db.Metric)

    # Otherwise, return the person whose id matches the input.
    else:
        res = select(m for m in db.Metric if m.metric_id == filters['id'])

    # Return the query response (sliced)
    return res[:]


def observation_summary(metric_id, t_summary, temp_value, s_summary, spatial_value,
                        min_time, max_time):
    return 'test'


spatial_resolution_error = Exception("Requested spatial resolution is finer than metric's")
temporal_resolution_error = Exception("Requested temporal resolution is finer than metric's")


# Define an observation endpoint query.
def getObservations(filters):
    s_rs = ['planet', 'country', 'state', 'county', 'block_group', 'tract', 'point']
    t_rs = ['yearly', 'monthly', 'weekly', 'daily']

    # Initialize response as empty
    res = None

    metric_id = filters['metric_id']

    # get metric info to check resolutions
    metric = db.Metric[metric_id]

    if 'spatial_resolution' in filters:
        # check that the requested spatial resolution is not higher than
        # the metric's
        if s_rs.index(filters['spatial_resolution']) > s_rs.index(metric.spatial_resolution):
            raise(spatial_resolution_error)
        elif s_rs.index(filters['spatial_resolution']) < s_rs.index(metric.spatial_resolution):
            s_summary = True
            spatial_value = filters['spatial_resolution']
        else:
            s_summary = False
            spatial_value = metric.spatial_resolution

    if 'temporal_resolution' in filters:
        # check that the requested spatial resolution is not higher than
        # the metric's
        if t_rs.index(filters['temporal_resolution']) > t_rs.index(metric.temporal_resolution):
            raise(temporal_resolution_error)
        elif t_rs.index(filters['temporal_resolution']) < t_rs.index(metric.temporal_resolution):
            t_summary = True
            temp_value = filters['temporal_resolution']
        else:
            t_summary = False
            temp_value = metric.temporal_resolution

    if 'start' in filters:
        min_time = datetime.strptime(filters['start'], '%Y-%m-%d').date()
    else:
        min_time = metric.min_time

    if 'end' in filters:
        max_time = datetime.strptime(filters['end'], '%Y-%m-%d').date()
    else:
        max_time = metric.max_time

    if t_summary or s_summary:
        return observation_summary(metric_id, t_summary, temp_value, s_summary, spatial_value,
                                   min_time, max_time)

    else:
        if 'place_id' in filters:
            res = select(o for o in db.Observation
                         if o.metric.metric_id == metric_id
                         and o.date_time.date >= min_time
                         and o.date_time.date <= max_time
                         and o.place.place_id == filters['place_id'])
        else:
            res = select(o for o in db.Observation
                         if o.metric.metric_id == metric_id
                         and o.date_time.date >= min_time
                         and o.date_time.date <= max_time)

    print(res)

    # Return the query response
    return res
