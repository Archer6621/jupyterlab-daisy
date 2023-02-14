import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel, INotebookTracker } from '@jupyterlab/notebook';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { ToolbarButton, ICommandPalette } from '@jupyterlab/apputils';
import { paletteIcon } from '@jupyterlab/ui-components';

import { Panel } from '@lumino/widgets';
import { IDisposable } from '@lumino/disposable';

import { requestAPI } from './handler';



// TODO: Should probably split sidebar logic/layout from button class
class ButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  app: JupyterFrontEnd;
  tracker: INotebookTracker;
  sidebar?: Panel = undefined;
  editor?: CodeMirrorEditor = undefined;
  daisy_address: string = "";

  constructor(app: JupyterFrontEnd, tracker: INotebookTracker) {
    this.app = app;
    this.tracker = tracker;
  }

  // Closes the sidebar and replaces the selected text
  // TODO: If the user modifies the selection, the sidebar should also close
  closeAndReplace(
    ev: MouseEvent,
    sidebar?: Panel
  ): void {
    sidebar?.close();
    let chosen = (ev.target as Element).textContent ?? '';
    this.editor?.replaceSelection(`${chosen}`);
  }

  setDaisyAddress(daisy_address: string): void {
      this.daisy_address = daisy_address;
  }


  populateList(asset_name: string, list: HTMLElement): void {
            while (list.firstChild != null) {
              list.removeChild(list.firstChild);
            }
            requestAPI<any>(`get-joinable?asset_id=${asset_name}`)
            .then(json => {
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
                    <th align="right">COMA Score</th>
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
                        this.closeAndReplace(ev, this.sidebar);
                      list.appendChild(bla);
                    }
                  );
                })
            .catch(reason => {console.error('AEUHHH????', reason);});
  }


  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const mybutton = new ToolbarButton({
      icon: paletteIcon,
      tooltip: "Augment Data",
      onClick: () => {
        this.sidebar?.close();

        const activeCell = this.tracker.activeCell;
        if (activeCell !== null) {
          this.editor = activeCell.editor as CodeMirrorEditor;
          let value = this.editor.getRange(
            this.editor.getCursor('start'),
            this.editor.getCursor('end')
          );


          this.sidebar = new Panel();
          this.sidebar.addClass('my-panel');
          this.sidebar.id = 'daisy-jupyterlab';
          this.sidebar.title.icon = paletteIcon;
          this.app.shell.add(this.sidebar, 'right', { rank: 50000 });
          this.app.shell.activateById(this.sidebar.id);

          const header = document.createElement('h1');
          header.textContent = 'Related Datasets';

          const form = document.createElement('form');
          const inp = document.createElement('input')
          inp.type = "text"
          inp.name = "name"
          inp.value = value
          inp.className = 'my-highlighted-item';



          const list = document.createElement('ul');
          list.className = 'my-list';

          form.appendChild(inp); 
          const temp = this;
          form.onsubmit = function(event) {
            event.preventDefault();
            event.stopPropagation();

            // TODO: Split off population of bar to other function
            // populateList(event.)
            const name = form.elements[0] as HTMLInputElement;
            console.log(name.value)
            temp.populateList(name.value, list)
          }

          this.sidebar?.node.appendChild(header);
          this.sidebar?.node.appendChild(form);
          this.sidebar?.node.appendChild(list);

          this.populateList(value, list);
        
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

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('jupyterlab_daisy settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for jupyterlab_daisy.', reason);
        });
    }

    const button = new ButtonExtension(app, tracker);
    app.docRegistry.addWidgetExtension('Notebook', button);
  }
};

export default plugin;
