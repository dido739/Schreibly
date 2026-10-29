import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';
const codeSyntaxHighlight = Editor.plugin;

const editor = new Editor({
  el: document.querySelector('#editor'),
  height: '600px',
  initialEditType: 'wysiwyg',
  previewStyle: 'vertical',
  // theme: 'dark',
  // plugins: [[codeSyntaxHighlight, { highlighter: Prism }]]
});

const getContentBtn = document.getElementById('getContentBtn');
            getContentBtn.addEventListener('click', () => {
                const content = editor.getMarkdown();
                console.log(content);
                alert(content);
            });