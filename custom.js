import Editor from '@toast-ui/editor';
import fs from 'node:fs';
import '@toast-ui/editor/dist/toastui-editor.css';

    function createGetMarkdownButton() {
        const button = document.createElement('button');

        button.className = 'toastui-editor-toolbar-icons last';
        button.style.backgroundImage = 'none';
        button.style.margin = '0';
        button.innerHTML = `<img src="file.png" alt="Get Markdown" style="width: 32px; height: 32px;">`;
        button.addEventListener('click', () => {
        //   editor.exec('bold');
            const content = editor.getMarkdown();
            console.log(content);
            alert(content);
            fs.writeFile('draft.md', content, err => {
            if (err) {
                console.error(err);
            } else {
                // file written successfully
            }
            })
        });

        return button;
      }
    function createGetHTMLButton() {
        const button = document.createElement('button');

        button.className = 'toastui-editor-toolbar-icons last';
        button.style.backgroundImage = 'none';
        button.style.margin = '0';
        button.innerHTML = `<img src="files(1).png" alt="Get HTML" style="width: 32px; height: 32px;">`;
        button.addEventListener('click', () => {
        //   editor.exec('bold');
            const content = editor.getHTML();
            console.log(content);
            alert(content);
            fs.writeFile('draft.html', content, err => {
            if (err) {
                console.error(err);
            } else {
                // file written successfully
            }
            })
        });

        return button;
      }


      const editor = new Editor({
        el: document.querySelector('#editor'),
        previewStyle: 'vertical',
        height: '500px',
        initialValue: 'The first and last buttons are customized.',
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
          // Using Option: Customize the last button
          [{
            el: createGetMarkdownButton(),
            command: 'bold',
            tooltip: 'Get Markdown',
          }, {
            el: createGetHTMLButton(),
            command: 'bold',
            tooltip: 'Get HTML',
          }]
        ]
      });

    //   editor.insertToolbarItem({ groupIndex: 0, itemIndex: 0 }, {
    //     name: 'myItem',
    //     tooltip: 'Custom Button',
    //     command: 'bold',
    //     text: '@',
    //     className: 'toastui-editor-toolbar-icons first',
    //     style: { backgroundImage: 'none' }
    //   });
    