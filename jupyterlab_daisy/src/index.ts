import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab_daisy extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_daisy:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab_daisy is activated!');
  }
};

export default plugin;
