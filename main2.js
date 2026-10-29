import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';

const content = `# Hello, TUI Editor!
This is a sample content for the TUI Editor. You can edit this content in the editor below and see the changes reflected in the viewer. Enjoy using TUI Editor!`;

const editor = new Editor({
        el: document.querySelector('#editor'),
        previewStyle: 'vertical',
        height: '500px',
        initialValue: content,
        theme: 'dark'
      });

const viewer = Editor.factory({
        el: document.querySelector('#viewer'),
        viewer: true,
        height: '500px',
        initialValue: content,
        theme: 'dark'
      });