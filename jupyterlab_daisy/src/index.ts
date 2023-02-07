import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

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
  daisy_address: string = "";

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
    let chosen = (ev.target as Element).textContent ?? '';
    editor.replaceSelection(`${chosen}`);
  }

  setDaisyAddress(daisy_address: string): void {
      this.daisy_address = daisy_address;
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

            fetch(`http://${this.daisy_address}/get-joinable?asset_id=${value}`).then(
              response => {
                if (response.status === 200) {
                  response.json().then(json => {
                    json['JoinableTables'].forEach(
                      (entry: {
                        table_path: string;
                        matches: Record<string, Record<string, string>>[];
                      }) => {
                        const bla = document.createElement('li');
                        bla.setAttribute(
                          'title',
                          `Matched ${entry.matches.length} columns, click '+' for details...`
                        );
                        const button = document.createElement('button');
                        button.className = 'my-button';
                        button.textContent = '+';
                        const text = document.createElement('p');
                        text.textContent = entry.table_path.split('/')[0];
                        text.className = 'my-list-item-text';
                        const tableContainer = document.createElement('div');
                        const table = document.createElement('table');
                        table.setAttribute('style', 'width: 100%;');
                        tableContainer.className =
                          'my-column-table-div-collapsed';
                        tableContainer.setAttribute('style', 'height: 0px');

                        tableContainer.appendChild(table);
                        bla.appendChild(button);
                        bla.appendChild(text);
                        bla.appendChild(tableContainer);
                        bla.className = 'my-list-item';
                        const tableHeader = document.createElement('tr');
                        tableHeader.innerHTML = `
                      <th>Column Name</th>
                      <th>COMA Score</th>
                      `;
                        table.appendChild(tableHeader);
                        entry.matches.forEach(match => {
                          const tr = document.createElement('tr');
                          tr.innerHTML = `
                          <td>${match['PK']['from_id']}</td>
                          <td class='alnright'>${match['RELATED']['coma']}</td>
                        `;
                          table.appendChild(tr);
                        });

                        button.onclick = () => {
                          if (
                            tableContainer.className === 'my-column-table-div'
                          ) {
                            tableContainer.className =
                              'my-column-table-div-collapsed';
                            button.className = 'my-button';
                            button.textContent = '+';
                            tableContainer.setAttribute('style', 'height: 0px');
                          } else {
                            tableContainer.className = 'my-column-table-div';
                            button.className = 'my-button-toggled';
                            button.textContent = '-';
                            tableContainer.setAttribute(
                              'style',
                              `height: ${table.clientHeight}px`
                            );
                          }
                        };
                        text.onclick = ev =>
                          this.closeAndReplace(ev, editor, this.sidebar);
                        list.appendChild(bla);
                      }
                    );
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
  optional: [ISettingRegistry, ICommandPalette, INotebookTracker],
  activate: (
    app: JupyterFrontEnd, 
    settingRegistry: ISettingRegistry | null,
    palette: ICommandPalette,
    tracker: INotebookTracker) => {
    console.log('JupyterLab extension jupyterlab_daisy is activated!');
    const button = new ButtonExtension(app, tracker);

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('jupyterlab_daisy settings loaded:', settings.composite);
          const daisy_address = settings.get('daisy_address').composite as string;
          button.setDaisyAddress(daisy_address);
        })
        .catch(reason => {
          console.error('Failed to load settings for jupyterlab_daisy.', reason);
        });
    }

    app.docRegistry.addWidgetExtension('Notebook', button);
  }
};

export default plugin;
