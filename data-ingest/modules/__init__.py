import configparser
from pathlib import Path

config = configparser.ConfigParser()
config.read('modules/dbconfig.ini')

db_cfg = config['DEFAULT']

root: Path = Path().resolve()
