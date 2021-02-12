##
# # API configuration file.
##

# Standard libraries
# import sys
import base64
import json

# Third party libraries
from configparser import ConfigParser
from argparse import ArgumentParser
from sqlalchemy import create_engine
# from sqlalchemy.exc import OperationalError
import boto3
from botocore.exceptions import ClientError


aws_profile = "default"
aws_region = "us-west-1"

def get_secret(secret_name="talus_dev_rds_secret", region_name="us-west-1"):
    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(service_name="secretsmanager", region_name=region_name)

    # In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
    # See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    # We rethrow the exception by default.
    try:
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
    except ClientError as e:
        if e.response["Error"]["Code"] == "DecryptionFailureException":
            # Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response["Error"]["Code"] == "InternalServiceErrorException":
            # An error occurred on the server side.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response["Error"]["Code"] == "InvalidParameterException":
            # You provided an invalid value for a parameter.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response["Error"]["Code"] == "InvalidRequestException":
            # You provided a parameter value that is not valid for the current
            # state of the resource.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response["Error"]["Code"] == "ResourceNotFoundException":
            # We can't find the resource that you asked for.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
    else:
        # Decrypts secret using the associated KMS CMK.
        # Depending on whether the secret is a string or binary, one of these fields
        # will be populated.
        if "SecretString" in get_secret_value_response:
            secret = get_secret_value_response["SecretString"]
            return secret
        else:
            decoded_binary_secret = base64.b64decode(
                get_secret_value_response["SecretBinary"]
            )
            return decoded_binary_secret


# Config class, instantiated in api/setup.py.

class Config:
    def __init__(self, config_file):

        # Create a new config parser and read the config file passed to Config
        # instance.
        cfg = ConfigParser()
        cfg.read(config_file)

        # Define command line  arguments.
        self.clargs = self.collect_arguments()

        # Populate session config variables with defaults, to be potentially
        # overidden by command line arguments.
        cfg['session'] = {}
        for key in cfg['DEFAULT']:
            print('key = ' + key)
            cfg['session'][key] = cfg['DEFAULT'][key]

        # Define the current database session based on command line arguments,
        # if they were provided
        # TODO make this more legible.
        for k, v in vars(self.clargs).items():
            if v is not None:
                if k.startswith('pg_'):
                    cfg['session'][k.split('_')[1]] = str(v)
                else:
                    cfg['session'][k] = str(v)

        # Define parameters for database connection, if available.
        # TODO make this more legible.
        self.db = {k: v
                   for k, v in dict(cfg['session']).items()
                   if k not in ['datadir']}

        # load env variables for things that aren't in the config
        db_list = ['user', 'password', 'host', 'port', 'dbname']
        for param in db_list:
            if param not in self.db:
                self.db[param] = os.environ[param]

        # if we still don't have a db password, get it from secrets manager
        if self.db['password'] is None:
            secrets = json.loads(get_secret(secret_name="talus-prod-1"))

            for param in db_list:
                if param not in self.db:
                    self.db[param] = secrets[param]

            # change dbname param to measles vs. generic secretsmanager
            self.db[dbname] = 'metric'

        # Convert type of 'port' to integer
        self.db['port'] = int(self.db['port'])

        print('self.db')
        # remove password from dict to be printed
        print_db = self.db.copy()
        print_db.pop('password', None)
        print(print_db)

        # Define database engine based on db connection parameters.
        self.engine = create_engine(f"postgresql+psycopg2://{self.db['user']}:{self.db['password']}@{self.db['host']}:{self.db['port']}/{self.db['dbname']}",
                                    use_batch_mode=True)

        # Debug mode is not used.
        self.debug = False

        # # Test the database connection. If it fails, quit.
        # try:
        #     self.engine.connect()
        #     print('Connected to database')
        # except OperationalError:
        #     print('Failed to connect to database')
        #     sys.exit(1)

    # Instance methods
    # To string
    def __str__(self):
        return pprint.pformat(self.__dict__)

    # Get item from config file (basically, a key-value pair)
    def __getitem__(self, key):
        return self.__dict__[key]

    # Set item from config file
    def __setitem__(self, key, value):
        self.__dict__[key] = value

    # Define argument parser to collect command line arguments from the user,
    # if provided.
    @staticmethod
    def collect_arguments():
        parser = ArgumentParser(description='Test', add_help=False)
        parser.add_argument('-h', '--pg-host')
        parser.add_argument('-p', '--pg-port', type=int)
        parser.add_argument('-d', '--pg-dbname')
        parser.add_argument('-u', '--pg-user')
        parser.add_argument('-w', '--pg-password')
        parser.add_argument('--help', action='help', help="""Please check the file config.py
                            for a list of command line arguments.""")

        args, unknown = parser.parse_known_args()

        return args
