from psycopg2.sql import SQL, Identifier

from modules.database_interface import format_response, run_query

import logging

logging.basicConfig(filename='measles_load.log', level=logging.ERROR,
                    format='%(asctime)s %(levelname)s %(name)s %(message)s')
logger = logging.getLogger(__name__)


@format_response
@run_query
def get_table(schema, table):
    q = 'SELECT * FROM {schema}.{table};'
    return (SQL(q).format(schema=Identifier(schema),
                          table=Identifier(table)))
