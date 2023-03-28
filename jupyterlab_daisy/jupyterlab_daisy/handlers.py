import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

from pathlib import Path

import tornado

import requests


class GetJoinable(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        config = get_config_or_default()
        daisy_url = config['url']

        asset_id = self.get_query_argument("asset_id")
        r = requests.get(f"{daisy_url}/get-joinable?asset_id={asset_id}")
        if r.status_code == 200:
            self.finish(json.dumps(r.json()))
        else:
            self.set_status(r.status_code)
            self.finish(f"Failure, Daisy responded with status {r.status_code}: {r.reason}")


class GetRelated(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        config = get_config_or_default()
        daisy_url = config['url']

        source_asset_id = self.get_query_argument("source_asset_id")
        target_asset_ids = self.get_query_argument("target_asset_ids")
        r = requests.get(f"{daisy_url}/get-related?source_asset_id={source_asset_id}&target_asset_ids={target_asset_ids}")
        if r.status_code == 200:
            self.finish(json.dumps(r.json()))
        else:
            self.set_status(r.status_code)
            self.finish(f"Failure, Daisy responded with status {r.status_code}: {r.reason}")


def get_config_or_default():
    cfg = {
        "url": "http://localhost:8080"
    }
    p = Path.home() / '.jupyter' / 'daisy_config.json'
    if p.exists():
        with open(p, 'r') as f:
            cfg = json.load(f)
    return cfg


def to_kebab_case(string):
    return ''.join(['-' + c.lower() if c.isupper() else c for c in string]).strip('-')


def create_handler(base_url, handler):
    name = to_kebab_case(handler.__name__)
    pattern = url_path_join(base_url, "jupyterlab-daisy", name)
    return (pattern, handler)


def setup_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    handlers = [
        create_handler(base_url, GetRelated),
        create_handler(base_url, GetJoinable)
    ]

    web_app.add_handlers(host_pattern, handlers)
