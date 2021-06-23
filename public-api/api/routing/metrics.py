# Standard libraries
from typing import List
from api.models.metrics import Observation
from datetime import date, datetime

# Third party libraries
from flask import request
from flask_restplus import Resource
from pony.orm import db_session
from pony.orm.core import Query, select

# Local libraries
from ..models import db
from ..db import api
from .. import schema
from ..utils import (
    format_response,
    get_county_fips_with_leading_zero,
    get_place_id_from_spatial_resolution,
)

strf_str = "%Y-%m-%d %H:%M:%S %Z"

# Initialize metric catalog or specifics endpoint


@api.route("/metric", methods=["GET"])
class Metric(Resource):
    parser = api.parser()
    parser.add_argument(
        "metric_id",
        type=int,
        required=False,
        help="""Unique ID of metric for which we're requesting info.
                             If not provided, all metrics are returned.""",
    )

    @api.doc(parser=parser)
    @db_session
    @format_response
    def get(self):
        params = request.args
        res = schema.getMetrics(params)
        return res


# Initialize get metric observations between datetimes
@api.route("/observations", methods=["GET"])
class Observations(Resource):
    parser = api.parser()
    parser.add_argument(
        "metric_id",
        type=int,
        required=True,
        help="Unique ID of metric for which observiations should be returned.",
    )
    parser.add_argument(
        "start",
        type=datetime,
        required=False,
        help="""Time of first observation to be returned. If not provided,
                                min_time for the metric is used.""",
    )
    parser.add_argument(
        "end",
        type=datetime,
        required=False,
        help="""Time of last observation to be returned. If not provided,
                                max_time for the metric is used.""",
    )
    parser.add_argument(
        "temporal_resolution",
        type=str,
        required=False,
        default="planet",
        choices=("yearly", "monthly", "weekly", "daily"),
        help="""Temporal resolution to use. Throws error if higher resolution
                than metric. Provides a summary at that level if lower.
                If not provided, native resolution of metric is returned.""",
    )
    parser.add_argument(
        "spatial_resolution",
        type=str,
        required=False,
        default="yearly",
        choices=(
            "planet",
            "country",
            "state",
            "county",
            "block_group",
            "tract",
            "point",
        ),
        help="""Spatial resolution to use. Throws error if higher resolution
                                than metric. Provides a summary at that level if lower.
                                If not provided, native resolution of metric is returned.""",
    )
    parser.add_argument(
        "place_id",
        type=int,
        required=False,
        help="""Optional place id to limit metric to only that location. """
        """If place names or ISO3 are defined, this should not also """
        """be defined.""",
    )
    parser.add_argument(
        "fields",
        type=str,
        required=False,
        help="""Optional field(s) to return.""",
    )
    parser.add_argument(
        "place_name",
        type=str,
        required=False,
        help="""Optional place id to limit metric to only that location. If place IDs or ISO3 are defined, this should not also be defined.""",
    )
    parser.add_argument(
        "place_iso3",
        type=str,
        required=False,
        help="""Optional place iso3 code to limit metric to only that location. If place IDs or names are defined, this should not also be defined.""",
    )
    parser.add_argument(
        "fips",
        type=str,
        required=False,
        help="""Optional fips code to limit metric to only that location. If place IDs or names are defined, this should not also be defined.""",
    )

    @api.doc(parser=parser)
    @db_session
    @format_response
    def get(self):
        params = dict(request.args)

        # if place_name not undefined, get place_ids from it and assign to
        # params place_id
        expected_place: bool = False
        place: db.Place = None
        if "place_name" in params:
            expected_place = True
            place_name = params["place_name"]
            place = db.Place.get(name=place_name)
            if place is not None:
                params["place_id"] = place.place_id
        elif "place_iso3" in params:
            expected_place = True
            place_iso3 = params["place_iso3"]
            place = db.Place.get(iso=place_iso3)
            if place is not None:
                params["place_id"] = place.place_id
        elif "fips" in params:
            expected_place = True
            fips: str = self.get_county_fips_no_leading_zero(params)
            place: db.Place = db.Place.get(fips=fips)
            if place is not None:
                params["place_id"] = place.place_id
        # if place is none but was expected, return empty
        if place is None and expected_place:
            return []

        (view_flag, res, lag) = schema.getObservations(filters=params)

        return schema.format_observations(view_flag, res, lag, params=params)

    def get_county_fips_no_leading_zero(self, params):
        """Given the params dictionary for the request, returns the county FIPS
        code (if any) without any leading zeros.

        Args:
            params (Dict[str, Any]): Params dictionary for the request

        Raises:
            ValueError: No county FIPS code is present in params dictionary

        Returns:
            str: If any, the county FIPS code in the params dictionary without
            any leading zeros.
        """
        if "fips" not in params:
            raise ValueError("No county FIPS code in params dictionary.")
        else:
            fips_tmp: str = params["fips"]
            has_leading_zero: bool = len(fips_tmp) == 5 and fips_tmp[0] == "0"
            fips: str = fips_tmp if not has_leading_zero else fips_tmp[1:]
            return fips


# Initialize get trend between end and lag # of periods prior
@api.route("/trend", methods=["GET"])
class Trend(Resource):
    parser = api.parser()
    parser.add_argument(
        "metric_id",
        type=int,
        required=True,
        help="Unique ID of metric for which observiations should be returned.",
    )
    parser.add_argument(
        "end",
        type=datetime,
        required=True,
        help="""End of the trending period to use. We'll compare the beginning
                                indicated by the lag to this period to get absolute and percent
                                change.""",
    )
    parser.add_argument(
        "lag",
        type=int,
        required=True,
        help="""Number of periods back to compare 'end' to. Will be in metric's
                                native resolution (so a monthly metric will go back <lag>
                                months)""",
    )
    parser.add_argument(
        "place_id",
        type=int,
        required=False,
        help="""Optional place id to limit metric to only that location.""",
    )

    @api.doc(parser=parser)
    @db_session
    @format_response
    def get(self):
        params = request.args
        (view_flag, place_lists, start, end) = schema.getTrend(params)

        lag = int(params["lag"])

        start_dict = {}
        end_dict = {}

        if view_flag:
            for place_id, place_list in place_lists.items():
                counter = 0

                for o in place_list:
                    o_date = o[2]
                    o_dict = {
                        "data_source": o[1],
                        "no_tz": o_date.replace(tzinfo=None),
                        "date_time": o_date.strftime(strf_str),
                        "definition": o[3],
                        "metric": o[4],
                        "observation_id": o[5],
                        "place_fips": o[6],
                        "place_id": place_id,
                        "place_iso": o[8],
                        "place_iso3": o[9],
                        "place_name": o[10],
                        "updated_at": o[11],
                        "value": o[12],
                    }

                    if counter == 0:
                        start_dict[place_id] = o_dict
                        counter += 1
                    else:
                        end_dict[place_id] = o_dict
        else:
            for place_id, place_list in place_lists.items():
                formattedData = [
                    r.to_dict(related_objects=True) for r in place_list
                ]
                counter = 0
                for o in formattedData:
                    o_date = o["date_time"].to_dict()["datetime"]

                    metric_info = o["metric"].to_dict()
                    o["metric"] = metric_info["metric_name"]
                    o["definition"] = metric_info["metric_definition"]

                    o["no_tz"] = o_date.replace(tzinfo=None)

                    o["date_time"] = o_date.strftime(strf_str)

                    place_info = o["place"].to_dict()
                    place_id = place_info["place_id"]
                    o["place_id"] = place_id
                    o["place_name"] = place_info["name"]
                    o["place_iso"] = place_info["iso2"]
                    o["place_iso3"] = place_info["iso"]
                    o["place_fips"] = place_info["fips"]
                    del [o["place"]]

                    if counter == 0:
                        start_dict[place_id] = o
                        counter += 1
                    else:
                        end_dict[place_id] = o

        trends = []

        for place, end_obs in end_dict.items():
            try:
                start_obs = start_dict[place]
            except KeyError:
                break

            trend = {}
            trend["metric"] = end_obs["metric"]
            trend["definition"] = end_obs["definition"]

            trend["start_date"] = start_obs["date_time"]
            trend["end_date"] = end_obs["date_time"]

            start_value = start_obs["value"]
            end_value = end_obs["value"]

            trend["start_obs"] = start_value
            trend["end_obs"] = end_value

            try:
                trend["percent_change"] = (
                    end_value - start_value
                ) / start_value
            except (TypeError, ZeroDivisionError):
                if end_value is None:
                    trend["percent_change"] = None
                elif start_value == 0 and end_value > 0:
                    trend["percent_change"] = 1e10  # TODO make infinity
                elif start_value == 0 and end_value < 0:
                    trend["percent_change"] = -1e10  # TODO make neg infinity
                elif start_value == 0 and end_value == 0:
                    trend["percent_change"] = 0
                else:
                    trend["percent_change"] = None

            try:
                trend["change_per_period"] = (end_value - start_value) / lag
            except (TypeError, ZeroDivisionError):
                trend["change_per_period"] = None

            trend["place_id"] = place
            trend["place_name"] = end_obs["place_name"]
            trend["place_iso"] = end_obs["place_iso"]
            trend["place_iso3"] = end_obs["place_iso3"]
            trend["place_fips"] = end_obs["place_fips"]

            no_tz_date = end_obs["no_tz"]

            # FIXME: make this work for realz
            if no_tz_date == end:
                trend["stale_flag"] = False
            else:
                trend["stale_flag"] = True

            trends.append(trend)

        return trends


# Initialize places catalog or specifics endpoint


@api.route("/observations_redux", methods=["GET"])
class ObservationRedux(Resource):
    parser = api.parser()
    parser.add_argument(
        "metric_id",
        type=int,
        required=True,
        help="Unique ID of metric for which observiations should be returned.",
    )
    # parser.add_argument(
    #     "start",
    #     type=date,
    #     required=False,
    #     help="""Date of first observation to be returned. If not provided,
    #                             min_time for the metric is used.""",
    # )
    # parser.add_argument(
    #     "end",
    #     type=date,
    #     required=False,
    #     help="""Date of last observation to be returned. If not provided,
    #                             max_time for the metric is used.""",
    # )
    # parser.add_argument(
    #     "temporal_resolution",
    #     type=str,
    #     required=False,
    #     default="planet",
    #     choices=("yearly", "monthly", "weekly", "daily"),
    #     help="""Temporal resolution to use. Throws error if higher resolution
    #                             than metric. Provides a summary at that level if lower.
    #                             If not provided, native resolution of metric is returned.""",
    # )
    parser.add_argument(
        "spatial_resolution",
        type=str,
        required=False,
        default="yearly",
        choices=(
            "planet",
            "country",
            "state",
            "county",
            "block_group",
            "tract",
            "point",
        ),
        help="""Spatial resolution to use. Throws error if higher resolution
                                than metric. Provides a summary at that level if lower.
                                If not provided, native resolution of metric is returned.""",
    )
    # parser.add_argument(
    #     "place_id",
    #     type=int,
    #     required=False,
    #     help="""Optional place id to limit metric to only that location. """
    #     """If place names or ISO3 are defined, this should not also """
    #     """be defined.""",
    # )
    # parser.add_argument(
    #     "fields",
    #     type=str,
    #     required=False,
    #     help="""Optional field(s) to return.""",
    # )
    # parser.add_argument(
    #     "place_name",
    #     type=str,
    #     required=False,
    #     help="""Optional place id to limit metric to only that location. If place IDs or ISO3 are defined, this should not also be defined.""",
    # )
    # parser.add_argument(
    #     "place_iso3",
    #     type=str,
    #     required=False,
    #     help="""Optional place iso3 code to limit metric to only that location. If place IDs or names are defined, this should not also be defined.""",
    # )
    # parser.add_argument(
    #     "fips",
    #     type=str,
    #     required=False,
    #     help="""Optional fips code to limit metric to only that location. If place IDs or names are defined, this should not also be defined.""",
    # )

    @db_session
    @format_response
    def get(self):

        # initialize parameters
        params: dict = dict(request.args)
        metric_id: int = params.get("metric_id")
        start_date: date = params.get("start_date")
        end_date: date = params.get("end_date")
        spatial_resolution: str = params.get("spatial_resolution")

        # validate parameters
        one_date: bool = start_date == end_date or (
            start_date is not None and end_date is None
        )
        if not one_date or start_date is None:
            raise NotImplementedError(
                "Start date must equal end date or be "
                "only date provided -- date ranges are not "
                "currently supported."
            )

        # get observation date
        start_date_vals: List[str] = start_date.split("-")
        start_date_ints: List[int] = list(
            map(lambda x: int(x), start_date_vals)
        )
        (year, month, day) = start_date_ints
        obs_date: date = date(year, month, day)

        # get place identifier for spatial resolution
        place_id_field: str = get_place_id_from_spatial_resolution(
            spatial_resolution
        )
        place_id_response_key: str = "place_" + place_id_field

        # make request
        q: Query = select(
            (getattr(i.place, place_id_field), i.value)
            for i in Observation
            if i.metric.metric_id == metric_id
            and i.date_time.datetime_date == obs_date
        )

        # return response with name and value fields only
        # for counties: include leading zeros in FIPS codes
        res: List[dict] = None
        if spatial_resolution != "county":
            res = [{place_id_response_key: t[0], "value": t[1]} for t in q]
        else:
            res = [
                {
                    place_id_response_key: get_county_fips_with_leading_zero(
                        t[0]
                    ),
                    "value": t[1],
                }
                for t in q
            ]
        return res


@api.route("/places", methods=["GET"])
class Places(Resource):
    parser = api.parser()
    parser.add_argument(
        "id",
        type=int,
        required=False,
        help="""Unique ID of place for which we're requesting info.
                             If not provided, all places are returned.""",
    )
    parser.add_argument(
        "by_region",
        type=bool,
        required=False,
        help="""If true, returns catalog of places by region.
                             If not provided, places are not returned by region.""",
    )
    parser.add_argument(
        "place_type",
        type=str,
        required=False,
        help="""Optional: The type of place to return, e.g.,
                        `country`.""",
    )

    @api.doc(parser=parser)
    @db_session
    @format_response
    def get(self):
        params = request.args

        # Setup filters
        filters = {}
        place_id = params.get("place_id", None)

        # was a specific place defined in the `place_id` arg?
        place_defined = place_id is not None
        if place_defined:
            filters["place_id"] = [int(place_id)]

        # get place type filter
        place_type = params.get("place_type", None)
        place_types = [place_type] if place_type is not None else None
        if place_types is not None:
            filters["place_type"] = place_types

        # If we are to organize the places by region, then set the organizing
        # attribute to the name of the region column in the places table.
        organizing_attribute = None
        if "by_region" in params and params["by_region"] == "true":
            organizing_attribute = "region"
        elif (
            place_types is not None
            and len(place_types) == 1
            and place_types[0] == "county"
        ):
            organizing_attribute = "fips"

        order = [
            "Europe",
            "Eastern Mediterranean",
            "Africa",
            "South-East Asia",
            "Western Pacific",
            "Americas",
            "Unspecified region",
        ]
        res = schema.getEntityInstances(
            db.Place, "place_id", organizing_attribute, order, filters, params
        )
        return res
