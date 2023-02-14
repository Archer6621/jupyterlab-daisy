import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

from traitlets import Unicode
from traitlets.config import Configurable

import tornado

import requests


# See: https://github.com/jupyterlab/extension-examples/issues/91#issuecomment-607665752
# "you could either set it in a Python script, in JSON or with CLI arguments:"
# e.g., start Jupyter Lab with: `jupyter lab --JupyterlabDaisyConfig.daisy_url=URL_HERE`
class JupyterlabDaisyConfig(Configurable):
    """
    Allows configuration of access to the Daisy api
    """
    daisy_url = Unicode(
        'http://localhost:8080', config=True,
        help="The URL for the Daisy api"
    )


class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        c = JupyterlabDaisyConfig(config=self.config)

        asset_id = self.get_query_argument("asset_id")
        daisy_url = c.daisy_url
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
