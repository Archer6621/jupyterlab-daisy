import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { CodeMirrorEditor } from '@jupyterlab/codemirror';

import { INotebookTracker } from '@jupyterlab/notebook';
import { ToolbarButton, ICommandPalette } from '@jupyterlab/apputils';
import { paletteIcon } from '@jupyterlab/ui-components';
import { Panel } from '@lumino/widgets';

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { IDisposable } from '@lumino/disposable';

// TODO: Should probably split sidebar logic/layout from button class
class ButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  app: JupyterFrontEnd;
  tracker: INotebookTracker;
  sidebar?: Panel = undefined;

  constructor(app: JupyterFrontEnd, tracker: INotebookTracker) {
    this.app = app;
    this.tracker = tracker;
  }

  // Closes the sidebar and replaces the selected text
  // TODO: If the user modifies the selection, the sidebar should also close
  closeAndReplace(
    ev: MouseEvent,
    editor: CodeMirrorEditor,
    sidebar?: Panel
  ): void {
    sidebar?.close();
    const chosen = (ev.target as Element).textContent ?? '';
    editor.replaceSelection(`${chosen}`);
  }

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const mybutton = new ToolbarButton({
      icon: paletteIcon,
      onClick: () => {
        this.sidebar?.close();

        const activeCell = this.tracker.activeCell;
        if (activeCell !== null) {
          const editor = activeCell.editor as CodeMirrorEditor;
          let value = editor.getRange(
            editor.getCursor('start'),
            editor.getCursor('end')
          );

          // If the selected value has no extension, we assume it to be 'csv'
          if (!value.includes('.')) {
            value += '.csv';
          }

          if (value.length > 0) {
            this.sidebar = new Panel();
            this.sidebar.addClass('my-panel');
            this.sidebar.id = 'daisy-jupyterlab';
            this.sidebar.title.icon = paletteIcon;
            this.app.shell.add(this.sidebar, 'right', { rank: 50000 });
            this.app.shell.activateById(this.sidebar.id);

            const bla = document.createElement('h1');
            bla.textContent = 'Related Datasets';
            this.sidebar?.node.appendChild(bla);

            const capt = document.createElement('h2');
            capt.textContent = `'${value}'`;
            capt.className = 'my-highlighted-item';
            this.sidebar?.node.appendChild(capt);

            const list = document.createElement('ul');
            list.className = 'my-list';
            this.sidebar?.node.appendChild(list);

            fetch(`http://localhost:443/get-joinable?table_name=${value}`).then(
              response => {
                if (response.status === 200) {
                  response.json().then(json => {
                    json.forEach((entry: { table_name: string }) => {
                      const bla = document.createElement('li');
                      bla.textContent = entry.table_name;
                      bla.className = 'my-list-item';
                      bla.onclick = ev =>
                        this.closeAndReplace(ev, editor, this.sidebar);
                      list.appendChild(bla);
                    });
                  });
                } else {
                  const bla = document.createElement('li');
                  bla.textContent = 'No related tables found!';
                  list.appendChild(bla);
                }
              }
            );
          }
        }
      }
    });

    // Add the toolbar button to the notebook toolbar
    panel.toolbar.insertItem(10, 'mybutton', mybutton);

    return mybutton;
  }
}

/**
 * Initialization data for the jupyterlab_daisy extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_daisy:plugin',
  autoStart: true,
  requires: [ICommandPalette, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    tracker: INotebookTracker
  ) => {
    console.log('JupyterLab extension jupyterlab_daisy is activated!');
    console.log('ICommandPalette:', palette);
    console.log('?');

    const button = new ButtonExtension(app, tracker);
    app.docRegistry.addWidgetExtension('Notebook', button);
  }
};

export default plugin;
