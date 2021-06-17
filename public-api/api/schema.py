##
# # API schema
##

# Standard libraries
from api.models.metrics import Place
import functools
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import pytz

# Third party libraries
from pony.orm import select

# Local libraries
from .models import db
from .utils import get_county_fips_with_leading_zero, passes_filters

# Constants
strf_str = "%Y-%m-%d %H:%M:%S %Z"

# Cache responses for API requests that have previously been made so that the
# computation does not need to be repeated.
USE_CACHING: bool = False


def cached(func):

    # Cache initially blank.
    cache = {}

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if USE_CACHING:
            # Get the key corresponding to the request
            key = str(kwargs)

            # If the request has been made before
            if key in cache:
                # Return the cached data for the response to the request
                return cache[key]

            # Otherwise
            # After the request is done, take the results and cache them for
            # next time
            results = func(*args, **kwargs)
            cache[key] = results
            return results
        else:
            return func(*args, **kwargs)

    # Return the function wrapper (for decoration)
    return wrapper


# Define a generic endpoint query.
def getEntityInstances(
    entity_class, id_field_name, organizing_attribute, order, filters, params
):

    # Get the entity instances.
    allInstances = select(o for o in entity_class).order_by(entity_class.name)

    # If order was specified for org. attr. values, use it, otherwise
    # get them from the data table.
    if order is None:
        order = select(getattr(o, organizing_attribute) for o in entity_class)

    # Filter instances
    instancesTmp = [o for o in allInstances if passes_filters(o, filters)]

    # If id param is not in the filters (query params), then return all
    # instances of the entity in the db. Otherwise return only the instance
    # with that ID.
    instances = None
    if "id" in params:
        instances = [
            o
            for o in instancesTmp
            if getattr(o, id_field_name) == int(params["id"])
        ]

    else:
        instances = instancesTmp

    # And if there is an organizing attribute, return outputs organized
    # by the values of that attribute.
    if organizing_attribute is not None:

        # # Get the values of the attribute
        # resKeys = select(
        #     getattr(o, organizing_attribute) for o in entity_class
        # )[:]

        # Organize outputs by these values.
        res = []

        # If true, skipp null value (None)
        skipNull = True

        # For each value of the organizing attribute that had data:
        for key in order:
            # Skip nulls if desired
            if skipNull and key is None:
                continue

            # Get ID and name of entity instance to return as output
            dataSets = [
                ({"name": o.name, "iso": o.iso})
                for o in instances
                if getattr(o, organizing_attribute) == key
            ]

            # Store the sets of data under the value of the
            # organizing attribute
            res.append(
                {
                    "name": key,
                    "data": dataSets,
                }
            )
        return res

    # Otherwise, return the instances without organizing them under
    # an attribute
    else:
        return [({"name": o.name, "iso": o.iso}) for o in instances]


# Define a metric endpoint query.
def getMetrics(filters):

    # Initialize response as empty
    res = None

    # If id param is not in the filters (query params), then return all people
    if "id" not in filters:
        res = select(m for m in db.Metric)

    # Otherwise, return the person whose id matches the input.
    else:
        res = select(m for m in db.Metric if m.metric_id == filters["id"])

    # Return the query response (sliced)
    return res[:]


def observation_summary(
    metric_id,
    t_summary,
    temp_value,
    s_summary,
    spatial_value,
    min_time,
    max_time,
):
    return "test"


spatial_resolution_error = Exception(
    "Requested spatial resolution is finer than metric's"
)
temporal_resolution_error = Exception(
    "Requested temporal resolution is finer than metric's"
)


def get_start(t_rs, end, lag):
    if t_rs == "yearly":
        start = end - relativedelta(years=lag)
    elif t_rs == "monthly":
        start = end - relativedelta(months=lag)
    elif t_rs == "weekly":
        start = end - timedelta(weeks=lag)
    elif t_rs == "daily":
        start = end - timedelta(days=lag)

    naive = start.tzinfo is None or start.tzinfo.utcoffset(start) is None
    return start if not naive else pytz.utc.localize(start)
    # return pytz.utc.localize(start)


def manage_lag(metric, null_res, max_time, null_places, observations):

    min_time = get_start(
        metric.temporal_resolution, max_time, metric.lag_allowed
    )

    if metric.is_view:
        if len(null_places) > 1:
            place_id_arr = (
                "{" + (", ".join(map(lambda x: str(x), null_places))) + "}"
            )
            place_id_q_str = (
                f"""AND v.place_id = ANY('{place_id_arr}'::int[])"""
            )
        elif len(null_places) == 0:
            place_id_q_str = ""
        else:
            place_id_q_str = f"""AND v.place_id = {null_places[0]}"""

        lag_res_q_str = f"""SELECT v.metric_id, v.data_source, d.dt,
                            m.metric_definition, m.metric_name,
                            v.observation_id,
                            p.fips AS place_fips, p.place_id, p.iso2
                            AS place_iso,
                            p.iso AS place_iso3,
                            p.name AS place_name, v.updated_at, v.value::FLOAT
                            FROM {metric.view_name} v
                            LEFT JOIN datetime d ON v.datetime_id = d.dt_id
                            LEFT JOIN place p ON v.place_id = p.place_id
                            LEFT JOIN metric m ON v.metric_id = m.metric_id
                            WHERE
                            d.dt >= '{min_time}'
                            {place_id_q_str}
                            AND d.dt <= '{max_time}'"""
        lag_res = db.select(lag_res_q_str)

    else:
        if len(null_places) > 1:
            lag_res = select(
                o
                for o in observations
                if o.metric.metric_id == metric.metric_id
                and o.date_time.datetime >= min_time
                and o.date_time.datetime <= max_time
                and o.place is not None
                and o.place.place_id in null_places
            )
        elif len(null_places) == 0:
            lag_res = select(
                o
                for o in observations
                if o.metric.metric_id == metric.metric_id
                and o.place is not None
                and o.date_time.datetime >= min_time
                and o.date_time.datetime <= max_time
            )
        else:
            lag_res = select(
                o
                for o in observations
                if o.metric.metric_id == metric.metric_id
                and o.date_time.datetime >= min_time
                and o.date_time.datetime <= max_time
                and o.place is not None
                and o.place.place_id == null_places[0]
            )

    latest_observation = {}

    for o in lag_res:
        place_id = o.place_id if metric.is_view else o.place.place_id

        if o.value is not None:
            if place_id in latest_observation:
                obs_dt = o.dt if metric.is_view else o.date_time.datetime
                latest_obs_dt = (
                    latest_observation[place_id].dt
                    if metric.is_view
                    else latest_observation[place_id].date_time.datetime
                )

                if obs_dt > latest_obs_dt:
                    latest_observation[place_id] = o
            else:
                latest_observation[place_id] = o

    return latest_observation.values()


# Define an observation endpoint query.
@cached
def getObservations(filters):
    s_rs = [
        "planet",
        "global",
        "country",
        "state",
        "county",
        "block_group",
        "tract",
        "point",
    ]
    t_rs = ["yearly", "monthly", "weekly", "daily", "occasion"]

    # Initialize response as empty
    res = None

    metric_id = filters["metric_id"]

    # get metric info to check resolutions
    metric = db.Metric[metric_id]

    if "spatial_resolution" in filters:
        # check that the requested spatial resolution is not higher than
        # the metric's
        # TODO check for opto
        if s_rs.index(filters["spatial_resolution"]) > s_rs.index(
            metric.spatial_resolution
        ):
            raise (spatial_resolution_error)
        elif s_rs.index(filters["spatial_resolution"]) < s_rs.index(
            metric.spatial_resolution
        ):
            s_summary = True
            spatial_value = filters["spatial_resolution"]
        else:
            s_summary = False
            spatial_value = metric.spatial_resolution

    if "temporal_resolution" in filters:
        # check that the requested spatial resolution is not higher than
        # the metric's
        if t_rs.index(filters["temporal_resolution"]) > t_rs.index(
            metric.temporal_resolution
        ):
            raise (temporal_resolution_error)
        elif t_rs.index(filters["temporal_resolution"]) < t_rs.index(
            metric.temporal_resolution
        ):
            t_summary = True
            temp_value = filters["temporal_resolution"]
        else:
            t_summary = False
            temp_value = metric.temporal_resolution

    if "start" in filters:
        min_time = pytz.utc.localize(
            datetime.strptime(filters["start"], "%Y-%m-%d")
        )
    else:
        min_time = metric.min_time

    if "end" in filters:
        max_time = pytz.utc.localize(
            datetime.strptime(filters["end"], "%Y-%m-%d")
        )
    else:
        max_time = metric.max_time

    is_view = metric.is_view

    place_id = None

    # If the metric is a view, then the pool of observations comes from that
    # view. Otherwise, it is simply the "Observations" entity.
    view_q_str = f"""SELECT v.metric_id, v.data_source, d.dt,
                        m.metric_definition, m.metric_name, v.observation_id,
                        p.fips AS place_fips, p.place_id, p.iso2 AS place_iso,
                        p.iso AS place_iso3,
                        p.name AS place_name, v.updated_at, v.value::FLOAT
                        FROM {metric.view_name} v
                        LEFT JOIN datetime d ON v.datetime_id = d.dt_id
                        LEFT JOIN place p ON v.place_id = p.place_id
                        LEFT JOIN metric m ON v.metric_id = m.metric_id
                        WHERE
                        d.dt >= '{min_time}'
                        AND d.dt <= '{max_time}'"""
    observations = None
    if "place_id" not in filters:
        if is_view:
            observations = db.select(view_q_str)
        else:
            observations = db.Observation

    if t_summary or s_summary:
        return observation_summary(
            metric_id,
            t_summary,
            temp_value,
            s_summary,
            spatial_value,
            min_time,
            max_time,
        )

    else:
        if is_view:
            if "place_id" in filters:
                view_q_str += f" AND p.place_id = {filters['place_id']}"
                place_id = filters["place_id"]

                res = db.select(view_q_str)
            else:
                res = db.select(view_q_str)

        else:
            if "place_id" in filters:
                if observations is None:
                    observations = db.Observation
                res = None
                if is_view:
                    res = select(o for o in observations)
                else:
                    res = select(
                        o
                        for o in observations
                        if o.metric.metric_id == metric_id
                        and o.date_time.datetime >= min_time
                        and o.date_time.datetime <= max_time
                        and o.place is not None
                        and o.place.place_id == filters["place_id"]
                    )

                place_id = filters["place_id"]
            else:
                res = select(
                    o
                    for o in observations
                    if o.metric.metric_id == metric_id
                    and o.place is not None
                    and o.date_time.datetime >= min_time
                    and o.date_time.datetime <= max_time
                )

        metric_lag_allowed = (
            metric.lag_allowed is not None and metric.lag_allowed > 0
        )
        lag_allowed = (
            True if (metric_lag_allowed and min_time == max_time) else False
        )

        if lag_allowed:
            if place_id is None:
                null_res = []
                null_places = []
                for o in res:
                    if o.value is None:
                        null_res.append(o)
                        if is_view:
                            null_places.append(o.place_id)
                        else:
                            null_places.append(o.place.place_id)

                lag = manage_lag(
                    metric, null_res, max_time, null_places, observations
                )
            else:
                res_list = list(res)

                if len(res_list) == 0 or res_list[0].value is None:
                    lag = manage_lag(
                        metric, res, max_time, [place_id], observations
                    )

        else:
            lag = None

        return (is_view, res, lag)


@cached
def format_observations(view_flag, res, lag, params):
    def get_subsetted_res_list(orig_res_list):
        """Return only a subset of the response list data fields, if they
        are defined.

        Parameters
        ----------
        orig_res_list : type
            Description of parameter `orig_res_list`.

        Returns
        -------
        type
            Description of returned object.

        """

        # format `place_fips` if needed
        if params["spatial_resolution"] == "county":
            has_place_fips: bool = (
                len(orig_res_list) > 0 and "place_fips" in orig_res_list[0]
            )
            if has_place_fips:
                d: dict = None
                for d in orig_res_list:
                    d["place_fips"] = get_county_fips_with_leading_zero(
                        d["place_fips"]
                    )

        limit_returned_fields = "fields" in params
        if limit_returned_fields:
            # get fields to return
            field_set = params["fields"].split(",")
            res_list_subset = list()
            for d in orig_res_list:
                res_list_subset.append({k: d[k] for k in field_set})

            return res_list_subset
        else:
            return orig_res_list

    if view_flag:
        res_list = []

        lagged_places = []

        if lag is not None and len(lag) > 0:
            for o in lag:
                res_list.append(
                    {
                        "data_source": o[1],
                        "date_time": o[2].strftime("%Y-%m-%d %H:%M:%S %Z"),
                        "definition": o[3],
                        "metric": o[4],
                        "observation_id": o[5],
                        "place_fips": o[6],
                        "place_id": o[7],
                        "place_iso": o[8],
                        "place_iso3": o[9],
                        "place_name": o[10],
                        "updated_at": o[11],
                        "value": o[12],
                        "stale_flag": True,
                    }
                )

                lagged_places.append(o[7])

        for o in res:

            if o.place_id in lagged_places:
                continue
            res_list.append(
                {
                    "data_source": o[1],
                    "date_time": o[2].strftime("%Y-%m-%d %H:%M:%S %Z"),
                    "definition": o[3],
                    "metric": o[4],
                    "observation_id": o[5],
                    "place_fips": o[6],
                    "place_id": o[7],
                    "place_iso": o[8],
                    "place_iso3": o[9],
                    "place_name": o[10],
                    "updated_at": o[11],
                    "value": o[12],
                    "stale_flag": False,
                }
            )

        res_list.sort(key=lambda o: (o["place_id"], o["date_time"]))

        # return only requested fields, if applicable
        return get_subsetted_res_list(res_list)
    else:
        # TODO address bottleneck at line below
        instances = res[:][:]
        formattedData = [i.to_dict(related_objects=True) for i in instances]

        if lag is not None and len(lag) > 0:
            lagData = [r.to_dict(related_objects=True) for r in lag]

            formattedData = [
                o for o in formattedData if o["value"] is not None
            ]

            for o in formattedData:
                o["stale_flag"] = False
            for o in lagData:
                o["stale_flag"] = True

            formattedData.extend(lagData)
        # TODO Fix possible bottleneck here
        for o in formattedData:
            metric_info = o["metric"].to_dict()
            o["metric"] = metric_info["metric_name"]
            o["definition"] = metric_info["metric_definition"]

            o["date_time"] = (
                o["date_time"].to_dict()["datetime"].strftime(strf_str)
            )

            place: Place = o["place"]
            o["place_id"] = place.place_id
            o["place_name"] = place.name
            o["place_iso"] = place.iso2
            o["place_iso3"] = place.iso
            o["place_fips"] = place.fips
            del [o["place"]]

    formattedData.sort(key=lambda o: (o["place_id"], o["date_time"]))
    # return only requested fields, if applicable
    return get_subsetted_res_list(formattedData)


# Define a trend endpoint query.
def getTrend(filters):
    # Initialize response as empty
    res = None

    metric_id = filters["metric_id"]

    # get metric info to check resolutions
    metric = db.Metric[metric_id]

    end = datetime.strptime(filters["end"], "%Y-%m-%d")
    lag = int(filters["lag"])

    t_rs = metric.temporal_resolution

    start = get_start(t_rs, end, lag)

    # TODO review calculation of start and min_time and their usage in the code
    # blocks below.
    min_time = get_start(
        metric.temporal_resolution,
        end,
        metric.lag_allowed if metric.lag_allowed is not None else lag,
    )

    if metric.is_view:
        q_str = f"""SELECT v.metric_id, v.data_source, d.dt,
                m.metric_definition, m.metric_name, v.observation_id,
                p.fips AS place_fips, p.place_id, p.iso2 AS place_iso,
                p.iso AS place_iso3,
                p.name AS place_name, v.updated_at, v.value::FLOAT
                FROM {metric.view_name} v
                LEFT JOIN datetime d ON v.datetime_id = d.dt_id
                LEFT JOIN place p ON v.place_id = p.place_id
                LEFT JOIN metric m ON v.metric_id = m.metric_id
                WHERE
                d.dt >= '{min_time}'
                AND d.dt <= '{end}'
                AND v.value IS NOT NULL
                """
        if "place_id" in filters:
            q_str += f" AND p.place_id = {filters['place_id']}"

            res = db.select(q_str)
        else:
            res = db.select(q_str)

        res_list = sorted(list(res), key=lambda o: (o.place_id, o.dt))

    else:
        if "place_id" in filters:
            res = select(
                o
                for o in db.Observation
                if o.metric.metric_id == metric_id
                and o.date_time.datetime >= min_time
                and o.date_time.datetime <= end
                and o.value is not None
                and o.place is not None
                and o.place.place_id == filters["place_id"]
            )
        else:
            res = select(
                o
                for o in db.Observation
                if o.metric.metric_id == metric_id
                and o.place is not None
                and o.date_time.datetime >= min_time
                and o.date_time.datetime <= end
                and o.value is not None
            )

        res_list = sorted(
            list(res), key=lambda o: (o.place.place_id, o.date_time.datetime)
        )

    place_lists = {}
    current_place = None

    if metric.is_view:

        for o in res_list:

            if o.place_id == current_place:
                place_lists[o.place_id].append(o)

            else:
                place_lists[o.place_id] = [o]

            current_place = o.place_id

        for place_id, pl in place_lists.items():
            place_lists[place_id] = pl[-2:]

        return (True, place_lists, start, end)

    else:
        for o in res_list:
            if o.place.place_id == current_place:
                place_lists[o.place.place_id].append(o)

            else:
                place_lists[o.place.place_id] = [o]

            current_place = o.place.place_id

        for place_id, pl in place_lists.items():
            place_lists[place_id] = pl[-2:]

        return (False, place_lists, start, end)
