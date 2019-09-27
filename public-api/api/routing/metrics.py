# Standard libraries
from datetime import datetime

# Third party libraries
from flask import request
from flask_restplus import Resource
from pony.orm import db_session

# Local libraries
from ..db import api
from .. import schema
from ..utils import format_response

# Initialize metric catalog or specifics endpoint
@api.route("/metric", methods=["GET"])
class Metric(Resource):
    parser = api.parser()
    parser.add_argument('metric_id', type=int, required=False,
                        help="""Unique ID of metric for which we're requesting info.
                             If not provided, all metrics are returned.""")

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
    parser.add_argument('metric_id', type=int, required=True,
                        help="Unique ID of metric for which observiations should be returned.")
    parser.add_argument('start', type=datetime, required=False,
                        help="""Time of first observation to be returned. If not provided,
                                min_time for the metric is used.""")
    parser.add_argument('end', type=datetime, required=False,
                        help="""Time of last observation to be returned. If not provided,
                                max_time for the metric is used.""")
    parser.add_argument('temporal_resolution', type=str, required=False, default='planet',
                        choices=('yearly', 'monthly', 'weekly', 'daily'),
                        help="""Temporal resolution to use. Throws error if higher resolution
                                than metric. Provides a summary at that level if lower.
                                If not provided, native resolution of metric is returned.""")
    parser.add_argument('spatial_resolution', type=str, required=False, default='yearly',
                        choices=('planet', 'country', 'state', 'county', 'block_group',
                                 'tract', 'point'),
                        help="""Spatial resolution to use. Throws error if higher resolution
                                than metric. Provides a summary at that level if lower.
                                If not provided, native resolution of metric is returned.""")
    parser.add_argument('place_id', type=int, required=False,
                        help="""Optional place id to limit metric to only that location.""")

    @api.doc(parser=parser)
    @db_session
    @format_response
    def get(self):
        params = request.args
        res = schema.getObservations(params)

        formattedData = [r.to_dict(related_objects=True) for r in res]

        for o in formattedData:
            metric_info = o['metric'].to_dict()
            o['metric'] = metric_info['metric_name']
            o['definition'] = metric_info['metric_definition']

            o['date_time'] = o['date_time'].to_dict()['date'].strftime('%Y-%m-%d')

            place_info = o['place'].to_dict()
            o['place_id'] = place_info['place_id']
            o['place_name'] = place_info['name']
            o['place_iso'] = place_info['iso']
            o['place_fips'] = place_info['fips']
            del[o['place']]

        return formattedData


# Initialize get trend between end and lag # of periods prior
@api.route("/trend", methods=["GET"])
class Trend(Resource):
    parser = api.parser()
    parser.add_argument('metric_id', type=int, required=True,
                        help="Unique ID of metric for which observiations should be returned.")
    parser.add_argument('end', type=datetime, required=True,
                        help="""End of the trending period to use. We'll compare the beginning
                                indicated by the lag to this period to get absolute and percent
                                change.""")
    parser.add_argument('lag', type=int, required=True,
                        help="""Number of periods back to compare 'end' to. Will be in metric's
                                native resolution (so a monthly metric will go back <lag>
                                months)""")
    parser.add_argument('place_id', type=int, required=False,
                        help="""Optional place id to limit metric to only that location.""")

    @api.doc(parser=parser)
    @db_session
    @format_response
    def get(self):
        params = request.args
        (res, start, end) = schema.getTrend(params)

        lag = int(params['lag'])

        formattedData = [r.to_dict(related_objects=True) for r in res]

        start_dict = {}
        end_dict = {}

        for o in formattedData:
            o_date = o['date_time'].to_dict()['date']

            metric_info = o['metric'].to_dict()
            o['metric'] = metric_info['metric_name']
            o['definition'] = metric_info['metric_definition']

            o['date_time'] = o_date.strftime('%Y-%m-%d')

            place_info = o['place'].to_dict()
            place_id = place_info['place_id']
            o['place_id'] = place_id
            o['place_name'] = place_info['name']
            o['place_iso'] = place_info['iso']
            o['place_fips'] = place_info['fips']
            del[o['place']]

            if o_date == start:
                start_dict[place_id] = o
            elif o_date == end:
                end_dict[place_id] = o

        trends = []

        for place, end_obs in end_dict.items():
            try:
                start_obs = start_dict[place]
            except KeyError:
                print(f'No matching observiation for place: {place}')
                break

            trend = {}
            trend['metric'] = end_obs['metric']
            trend['definition'] = end_obs['definition']

            trend['start_date'] = start_obs['date_time']
            trend['end_date'] = end_obs['date_time']

            start_value = start_obs['value']
            end_value = end_obs['value']

            trend['start_obs'] = start_value
            trend['end_obs'] = end_value

            try:
                trend['percent_change'] = (end_value - start_value) / start_value
            except (TypeError, ZeroDivisionError):
                trend['percent_change'] = None

            try:
                trend['change_per_period'] = (end_value - start_value) / lag
            except (TypeError, ZeroDivisionError):
                trend['change_per_period'] = None

            trend['place_id'] = place
            trend['place_name'] = end_obs['place_name']
            trend['place_iso'] = end_obs['place_iso']
            trend['place_fips'] = end_obs['place_fips']

            trends.append(trend)

        return trends
