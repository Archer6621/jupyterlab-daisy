# Jupyterlab Daisy Extension

This Jupyterlab extension allows you to obtain suggestions for related tables by selecting some text representing a table name and then clicking the corresponding button on the UI. A sidebar will open with table name suggestions obtained from Daisy, which you can click to instantly replace the selected table name.

Requires [Daisy](https://github.com/OpertusMundi/discovery-service) running in the background.

## Installation instructions

1. Go to the [releases](https://github.com/Archer6621/jupyterlab-daisy/releases)
2. On the latest release, download the wheel (`.whl` file) that is attached to it (usually named something like `jupyterlab_daisy-#.#.#-py3-none-any.whl`)
3. Execute `pip install <location of downloaded wheel>` while your desired jupyter/conda environment is active
4. Then start Jupyter Lab in that environment, or if it was already running, refresh the browser window.


## Development
Setting up the development environment is largely based on the [Jupyterlab extension tutorial](https://jupyterlab.readthedocs.io/en/stable/extension/extension_tutorial.html), so follow that for the initial setup (until but not including "Create a repository").

You may use `jlpm run watch` in the root folder to watch/compile on the fly. Then, just make sure you open Jupyterlab (`jupyter lab`) in the conda environment that you use for development, and you should be set!

NOTE: Building the wheel for the extension on Windows does not work, an issue was made for this: https://github.com/jupyterlab/jupyterlab/issues/12725
