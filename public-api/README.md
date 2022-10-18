# public-api

Public API template code in Python, containing no authentication.

1. Install all requirements with `pipenv install -r requirements.txt`
1. Optional: Provide a `dbconfig.ini` file with the database connection parameters. A
   blank file is included in this directory as an example. **You may instead define connection parameters as command line arguments in the next step.**
1. Run the application, omitting the parameters below if you've specified a `dbconfig.ini` file.
   ```
   pipenv run python application.py -h [PG_HOST] -u [PG_USERNAME] -d [PG_DATABASE] -w [PG_PASSWORD] -p 5002
   ```

The latest deployed version is in branch `amp-metric-api-amazonlinux2`.
