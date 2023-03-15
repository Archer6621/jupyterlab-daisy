import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

from traitlets import Unicode
from traitlets.config import Configurable

from pathlib import Path

import tornado

import requests



class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        daisy_url = "http://localhost:8080"
        p = Path.home() / '.jupyter' / 'daisy_config.json'
        if p.exists():
            with open(p, 'r') as f:
                c = json.load(f)
                daisy_url = c["url"]

        asset_id = self.get_query_argument("asset_id")
        r = requests.get(f"{daisy_url}/get-joinable?asset_id={asset_id}")
        if r.status_code == 200:
            self.finish(json.dumps(r.json()))
        else:
            self.finish(f"Failure, Daisy responded with status {r.status_code}: {r.reason}")


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "jupyterlab-daisy", "get-joinable")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
