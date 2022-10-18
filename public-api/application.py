from flask import Flask
from api import app as application

application = app = Flask(__name__)


def main():
    application = app = Flask(__name__)
    application.run(host="localhost", port=5002, debug=True)


if __name__ == "__main__":
    main()
