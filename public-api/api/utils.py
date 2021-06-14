# Standard libraries
import functools
from typing import Any

# Third party libraries
import flask
from flask.globals import request
from pony.orm.core import QueryResult
from werkzeug.exceptions import NotFound


# Returns true if database entity class instance's attribute contains a value
# in the filter set, false otherwise.
def passes_filters(instance, filters):
    passes = True

    for filter_set_name in filters:

        if filter_set_name == "place_type":
            if instance.place_type not in filters[filter_set_name]:
                passes = False
            continue
        else:

            # Get filter set
            filterSet = set(filters[filter_set_name])

            # Get instance attribute values
            instanceSetTmp = getattr(instance, filter_set_name)

            # If wrong type, cast to set
            instanceSet = None
            if type(instanceSetTmp) != set:
                instanceSet = set([instanceSetTmp])
            else:
                instanceSet = instanceSetTmp

            # If instance fails one filter, it fails completely.
            if len(instanceSet & filterSet) == 0:
                passes = False
    return passes


# A decorator to format API responses (Query objects) as
# { data: [{...}, {...}] }


def format_response(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            # Load unformatted data from prior function return statement.
            unformattedData = func(*args, **kwargs)

            # Init formatted data.
            formattedData = []

            # If the type of unformatted data was a query result, parse it as
            # items in a dictionary.
            if type(unformattedData) == QueryResult:
                formattedData = [r.to_dict() for r in unformattedData]
            # Otherwise, it is a tuple or list, and should be
            # returned directly.
            else:
                formattedData = unformattedData[:]
            results = {
                "data": formattedData,
                "error": False,
                "message": "Success",
            }

        # If there was an error, return it.
        except NotFound:
            results = {
                "data": request.path,
                "error": True,
                "message": "404 - not found",
            }
        # except Exception as e:
        #     print(e)
        #     results = {
        #         "data": '',
        #         "error": True,
        #         "message": str(e),
        #     }

        # Convert entire response to JSON and return it.
        return flask.jsonify(results)

    # Return the function wrapper (allows a succession of decorator
    # functions to be called)
    return wrapper


def get_county_fips_with_leading_zero(place_fips: str) -> str:
    """Returns the given county FIPS code with leading zeros (5 digits).

    Args:
        place_fips (str): The original county FIPS code.

    Raises:
        ValueError: `place_fips` not a string or a number

    Returns:
        str: The county FIPS code with leading zeros, if any.
    """
    if place_fips is None:
        return None
    else:
        place_fips_type: Any = type(place_fips)
        if place_fips_type == int:
            return place_fips
        elif place_fips_type == str:
            if len(place_fips) == 4:
                return "0" + place_fips
            else:
                return place_fips
        else:
            raise ValueError("Unexpected type: " + str(place_fips_type))
