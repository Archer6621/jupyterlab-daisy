# Jupyterlab Daisy Extension

This Jupyterlab extension allows a user to obtain suggestions for related tables by selecting some text representing a table name and

## Installation instructions

Download the tarball that is added to any release, and then execute the following command in your desired environment:
```
pip install <location of tarball>
```

## Development
Setting up the development environment is largely based on the [Jupyterlab extension tutorial](https://jupyterlab.readthedocs.io/en/stable/extension/extension_tutorial.html), so follow that for the initial setup (until but not including "Create a repository").

You may use `jlpm run watch` in the root folder to watch/compile on the fly. Then, just make sure you open Jupyterlab (`jupyter lab`) in the conda environment that you use for development, and you should be set!
