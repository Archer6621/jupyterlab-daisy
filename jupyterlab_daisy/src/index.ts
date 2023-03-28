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


// TODO: Remove code duplication
populateListRelated(source_asset_name: string, target_asset_names: Array<string>, list: HTMLElement): void {
            while (list.firstChild != null) {
              list.removeChild(list.firstChild);
            }
            requestAPI<any>(`get-related?source_asset_id=${source_asset_name}&target_asset_ids=${target_asset_names.join(',')}`)
            .then(json => {
                  if (json['RelatedTables'].length === 0) {
                      const notFound = document.createElement('div');
                      notFound.className = "my-list-item-error"
                      notFound.textContent = "Could not find any connections..."
                      list.appendChild(notFound);
                  }


                  json['RelatedTables']?.forEach(
                    (entry: {
                      links: Array<string>;
                    }) => {
                      const bla = document.createElement('li');

                      const button = document.createElement('button');
                      button.className = 'my-button';
                      button.textContent = '+';
                      const text = document.createElement('p');
                      const splitLinks = entry.links.map(l => l.split('/'))
                      const itemName = `${splitLinks[0][splitLinks[0].length - 2]}/${splitLinks[0][splitLinks[0].length - 1]} -> ${splitLinks[splitLinks.length - 1][splitLinks[splitLinks.length - 1].length - 2]}/${splitLinks[splitLinks.length - 1][splitLinks[splitLinks.length - 1].length - 1]}`
                      bla.setAttribute(
                        'title',
                        `${itemName}. Click '+' for details...`
                      );
                      text.textContent = itemName;
                      text.className = 'my-list-item-text';
                      const tableContainer = document.createElement('div');
                      const table = document.createElement('table');
                      table.setAttribute('style', 'width: 100%;');
                      tableContainer.className =
                        'my-column-table-div-collapsed';
                      tableContainer.setAttribute('style', 'height: 0px');

                      tableContainer.appendChild(table);

                      const itemDiv = document.createElement('div')
                      itemDiv.className = 'my-list-item-div'

                      itemDiv.appendChild(button)
                      itemDiv.appendChild(text)
                      bla.appendChild(itemDiv);
                      bla.appendChild(tableContainer);
                      bla.className = 'my-list-item';
                      const tableHeader = document.createElement('tr');
                      tableHeader.innerHTML = `
                    <th>Connected via</th>
                    `;


                      table.appendChild(tableHeader);

                      splitLinks.forEach(link => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                        <td>${link[link.length - 2]}/${link[link.length - 1]}</td>
                      `;
                        table.appendChild(tr);
                      })


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
            .catch(reason => {
                const notFound = document.createElement('div');
                notFound.className = "my-list-item-error"
                notFound.textContent = "Oh no, something went wrong..."
                if (reason.message.includes('400')) {
                  notFound.textContent = "Wrong input, make sure to fill in all fields..."
                } else if (reason.message.includes('403')) {
                  notFound.textContent = "Make sure the source is different from the target tables..."
                } else if (reason.message.includes('404')) {
                  notFound.textContent = "Could not find any connections..."
                }
                list.appendChild(notFound);
                console.log("error reason", reason);
            });
  }


  populateList(asset_name: string, list: HTMLElement): void {
            while (list.firstChild != null) {
              list.removeChild(list.firstChild);
            }
            requestAPI<any>(`get-joinable?asset_id=${asset_name}`)
            .then(json => {
                  json['JoinableTables']?.forEach(
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
                      const pathSplit = entry.table_path.split('/')
                      text.textContent = pathSplit[pathSplit.length - 1];
                      text.className = 'my-list-item-text';
                      const tableContainer = document.createElement('div');
                      const table = document.createElement('table');
                      table.setAttribute('style', 'width: 100%;');
                      tableContainer.className =
                        'my-column-table-div-collapsed';
                      tableContainer.setAttribute('style', 'height: 0px');

                      tableContainer.appendChild(table);
                      const itemDiv = document.createElement('div')
                      itemDiv.className = 'my-list-item-div'

                      itemDiv.appendChild(button)
                      itemDiv.appendChild(text)
                      bla.appendChild(itemDiv);
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
                        const split = match['PK']['from_id'].split('/')
                        tr.setAttribute('title', match['PK']['from_id'])
                        tr.innerHTML = `
                        <td>${split[split.length-2]}/${split[split.length-1]}</td>
                        <td class='alnright'>${parseFloat(match['RELATED']['coma']).toFixed(3)}</td>
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
            .catch(reason => {
                const notFound = document.createElement('div');
                notFound.className = "my-list-item-error"
                notFound.textContent = "Oh no, something went wrong..."
                if (reason.message.includes('400')) {
                  notFound.textContent = "Wrong input, make sure to fill in all fields..."
                } else if (reason.message.includes('404')) {
                  notFound.textContent = "Could not find any connections..."
                }
                list.appendChild(notFound);
                console.log("error reason:", reason);
            });
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


          const runButton = document.createElement('button');
          runButton.textContent = 'Execute Query';
          runButton.className = 'my-query-button'


          const inp = document.createElement('input')
          inp.type = "text"
          inp.name = "name"
          inp.id = "source"
          inp.value = value
          inp.className = 'my-highlighted-item';
          inp.placeholder = "Source Table Name"

          const sep = document.createElement('hr')
          sep.className = 'solid'

          const additionalFields = document.createElement('div');
          additionalFields.id = "targets"

          const form = document.createElement('form');
          
          form.appendChild(inp); 
          form.appendChild(sep);
          form.appendChild(additionalFields);
          form.appendChild(runButton);

          const checkbox = document.createElement('input')
          checkbox.type="checkbox"
          checkbox.id="related"
          checkbox.name="related"

          const checkboxLabel = document.createElement('label')
          checkboxLabel.htmlFor = "related"
          checkboxLabel.textContent = "Connect to existing assets"

          const checkboxSpan = document.createElement('span')
          checkboxSpan.appendChild(checkbox)
          checkboxSpan.appendChild(checkboxLabel)

          const addField = function(node: HTMLElement|null) {
              const extraInp = document.createElement('input')
              extraInp.type = "text"
              extraInp.name = `target-${additionalFields.childElementCount}`
              extraInp.value = ""
              extraInp.className = 'my-highlighted-item';

              const delButton = document.createElement('button');
              delButton.className = 'my-button';
              delButton.textContent = '-';
              delButton.type = "button"

              const fieldSpan = document.createElement('span')
              fieldSpan.className = "my-input-span"
              fieldSpan.appendChild(extraInp)
              fieldSpan.appendChild(delButton)

              delButton.onclick = (event) => {
                fieldSpan.remove()
                for (let i = 0; i < additionalFields.childElementCount; i++) {
                  (additionalFields.children[i].children[0] as HTMLInputElement).placeholder = `Table Name ${i}`;
                }
              }


              additionalFields.insertBefore(fieldSpan, node?.nextSibling ?? null);

              for (let i = 0; i < additionalFields.childElementCount; i++) {
                (additionalFields.children[i].children[0] as HTMLInputElement).placeholder = `Table Name ${i}`;
              }
          }



          checkbox.addEventListener('change', (event) => {
            if ((event.currentTarget as HTMLInputElement).checked) {
              addField(null);
              const addButton = document.createElement('button');
              addButton.className = 'my-query-button';
              addButton.textContent = 'Add Item';
              addButton.type = "button"
              addButton.onclick = () => {addField(additionalFields.lastChild as HTMLElement)}
              addButton.id = "addButton";
              form.insertBefore(addButton, runButton)
            } else {
              while (additionalFields.firstChild != null) {
                additionalFields.removeChild(additionalFields.firstChild);
              }
              document.getElementById('addButton')!.remove();
            }
          })





          const list = document.createElement('ul');
          list.className = 'my-list';

          const temp = this;
          form.onsubmit = function(event) {
            event.preventDefault();
            event.stopPropagation();

            if (!checkbox.checked) {
              temp.populateList(inp.value, list)
            } else {
              const targets = []
              for (const child of additionalFields.children) {
                const target = (child.children[0] as HTMLInputElement).value
                targets.push(target)
              }
              temp.populateListRelated(inp.value, targets, list);
            }
          }

          this.sidebar?.node.appendChild(header);
          this.sidebar?.node.appendChild(checkboxSpan);
          this.sidebar?.node.appendChild(form);
          this.sidebar?.node.appendChild(list);
        
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
