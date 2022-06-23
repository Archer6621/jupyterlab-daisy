# Jupyterlab Daisy Extension

This Jupyterlab extension allows you to obtain suggestions for related tables by selecting some text representing a table name and then clicking the corresponding button on the UI. A sidebar will open with table name suggestions obtained from Daisy, which you can click to instantly replace the selected table name.

## Installation instructions

Download the wheel that is added to any release, and then execute the following command in your desired conda/jupyter environment:
```
pip install <location of wheel>
```

## Development
Setting up the development environment is largely based on the [Jupyterlab extension tutorial](https://jupyterlab.readthedocs.io/en/stable/extension/extension_tutorial.html), so follow that for the initial setup (until but not including "Create a repository").

You may use `jlpm run watch` in the root folder to watch/compile on the fly. Then, just make sure you open Jupyterlab (`jupyter lab`) in the conda environment that you use for development, and you should be set!

NOTE: Building the wheel for the extension on Windows does not work, an issue was made for this: https://github.com/jupyterlab/jupyterlab/issues/12725
