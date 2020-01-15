import functools
import logging
import sys
import traceback
from collections import UserList

import psycopg2 as psycopg2
from psycopg2.extras import DictCursor
from psycopg2.sql import Composed

from modules import db_cfg

module_logger = logging.getLogger('measles.database_interface')


class DBConn(object):
    def __init__(self, **kwargs):
        self.db_kwargs = {**db_cfg,
                          **kwargs}

    def __enter__(self):
        self.conn = psycopg2.connect(**self.db_kwargs)
        return self.conn

    def __exit__(self, *args):
        self.conn.close()


class DBResult(UserList):
    def __init__(self, data, error, message):
        super().__init__(data)
        self.error = error
        self.message = message


def query_db(query, args=None):
    data = []
    with DBConn() as conn:
        cursor = conn.cursor(cursor_factory=DictCursor)
        cursor.execute(query, args)
        try:
            data = cursor.fetchall()
        except psycopg2.ProgrammingError as e:
            module_logger.debug(e)
            data = []
        finally:
            conn.commit()
            cursor.close()
            return data


def dry_run_query_db(query, args=None):
    with DBConn() as conn:
        cursor = conn.cursor(cursor_factory=DictCursor)
        return cursor.mogrify(query, args).decode('utf-8')


def dry_run_query(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        query = func(*args, **kwargs)

        if isinstance(query, str):
            data = dry_run_query_db(query)
        elif isinstance(query, Composed):
            data = dry_run_query_db(query)
        elif isinstance(query[1], dict):
            data = dry_run_query_db(query[0], query[1])
        else:
            data = dry_run_query_db(query[0], query[1:])

        print(data)

    return wrapper


def run_query(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        query = func(*args, **kwargs)

        if isinstance(query, str):
            data = query_db(query)
        elif isinstance(query, Composed):
            data = query_db(query)
        elif isinstance(query[1], dict):
            data = query_db(query[0], query[1])
        else:
            data = query_db(query[0], query[1:])

        return [dict(d) for d in data]

    return wrapper


def format_response(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            results = DBResult(data=func(*args, **kwargs),
                               error=False,
                               message='Success')
        except Exception as e:
            results = DBResult(data=traceback.format_exc().split('\n'),
                               error=True,
                               message=str(e))

        if results.error:
            module_logger.error(results.message)
            for d in results:
                module_logger.debug(d)
            sys.exit(1)

        return results

    return wrapper
