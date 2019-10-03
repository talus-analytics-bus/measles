##
# # API schema
##

# Standard libraries
import functools
from datetime import datetime, timedelta

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
        min_time = datetime.strptime(filters['start'], '%Y-%m-%d')
    else:
        min_time = metric.min_time

    if 'end' in filters:
        max_time = datetime.strptime(filters['end'], '%Y-%m-%d')
    else:
        max_time = metric.max_time

    if t_summary or s_summary:
        return observation_summary(metric_id, t_summary, temp_value, s_summary, spatial_value,
                                   min_time, max_time)

    else:
        if metric.is_view:
            q_str = f"""SELECT v.metric_id, v.data_source, d.dt,
                    m.metric_definition, m.metric_name, v.observation_id,
                    p.fips AS place_fips, p.place_id, p.iso AS place_iso,
                    p.name AS place_name, v.updated_at, v.value::FLOAT
                    FROM {metric.view_name} v
                    LEFT JOIN datetime d ON v.datetime_id = d.dt_id
                    LEFT JOIN place p ON v.place_id = p.place_id
                    LEFT JOIN metric m ON v.metric_id = m.metric_id
                    WHERE
                    d.dt >= '{min_time}'
                    AND d.dt <= '{max_time}'"""

            if 'place_id' in filters:
                q_str += f" AND p.place_id = {filters['place_id']}"

                res = db.select(q_str)
            else:
                res = db.select(q_str)

            return (True, res)
        else:
            if 'place_id' in filters:
                res = select(o for o in db.Observation
                             if o.metric.metric_id == metric_id
                             and o.date_time.datetime >= min_time
                             and o.date_time.datetime <= max_time
                             and o.place.place_id == filters['place_id'])
            else:
                res = select(o for o in db.Observation
                             if o.metric.metric_id == metric_id
                             and o.date_time.datetime >= min_time
                             and o.date_time.datetime <= max_time)

            return (False, res)


# Define an observation endpoint query.
def getTrend(filters):
    # Initialize response as empty
    res = None

    metric_id = filters['metric_id']

    # get metric info to check resolutions
    metric = db.Metric[metric_id]

    end = datetime.strptime(filters['end'], '%Y-%m-%d')
    lag = int(filters['lag'])

    t_rs = metric.temporal_resolution
    if t_rs == 'yearly':
        print('here: ', end.year, lag)
        start = datetime(end.year - lag, end.month, end.day)
    elif t_rs == 'monthly':
        years, months = divmod(lag, 12)

        if years == 0:
            if months >= end.month:
                start = datetime(end.year - 1, end.month + 12 - months, end.day)
            else:
                start = datetime(end.year, end.month - months, end.day)
        else:
            if months >= end.month:
                start = datetime(end.year - (years + 1), end.month + 12 - months, end.day)
            else:
                start = datetime(end.year - (years), end.month - months, end.day)
    elif t_rs == 'weekly':
        start = end - timedelta(weeks=lag)
    elif t_rs == 'daily':
        start = end - timedelta(days=lag)

    print(start, end)

    if metric.is_view:
        q_str = f"""SELECT v.metric_id, v.data_source, d.dt,
                m.metric_definition, m.metric_name, v.observation_id,
                p.fips AS place_fips, p.place_id, p.iso AS place_iso,
                p.name AS place_name, v.updated_at, v.value::FLOAT
                FROM {metric.view_name} v
                LEFT JOIN datetime d ON v.datetime_id = d.dt_id
                LEFT JOIN place p ON v.place_id = p.place_id
                LEFT JOIN metric m ON v.metric_id = m.metric_id
                WHERE
                d.dt in ('{start}', '{end}')"""
        if 'place_id' in filters:
            q_str += f" AND p.place_id = {filters['place_id']}"

            res = db.select(q_str)
        else:
            res = db.select(q_str)

        print(res)

        return (True, res, start, end)
    else:
        if 'place_id' in filters:
            res = select(o for o in db.Observation
                         if o.metric.metric_id == metric_id
                         and o.date_time.datetime in (start, end)
                         and o.place.place_id == filters['place_id'])
        else:
            res = select(o for o in db.Observation
                         if o.metric.metric_id == metric_id
                         and o.date_time.datetime in (start, end))

        # Return the query response
        return (False, res, start, end)
