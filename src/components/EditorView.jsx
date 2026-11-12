import { useEffect, useRef } from 'react';
import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';
import { exportHTML, exportMarkdown } from '../lib/text.js';

export default function EditorView({ doc, theme, onEdit, apiRef }) {
  const hostRef = useRef(null);
  const editorRef = useRef(null);
  const lastMd = useRef('');
  const loading = useRef(false);
  const loadedId = useRef(doc.id);
  const docRef = useRef(doc);
  const onEditRef = useRef(onEdit);
  docRef.current = doc;
  onEditRef.current = onEdit;

  // Create the editor once.
  useEffect(() => {
    const editor = new Editor({
      el: hostRef.current,
      height: '100%',
      initialEditType: 'wysiwyg',
      previewStyle: 'vertical',
      usageStatistics: false,
      placeholder: 'Start writing…',
      initialValue: docRef.current.markdown,
      toolbarItems: [
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task', 'indent', 'outdent'],
        ['table', 'image', 'link'],
        ['code', 'codeblock'],
      ],
    });
    editorRef.current = editor;
    loadedId.current = docRef.current.id;
    lastMd.current = editor.getMarkdown(); // the editor may normalise the text slightly

    editor.on('change', () => {
      if (loading.current) return;
      const md = editor.getMarkdown();
      if (md === lastMd.current) return; // ignore programmatic loads
      lastMd.current = md;
      onEditRef.current({ markdown: md });
    });

    apiRef.current = {
      jumpToHeading(index) {
        const base = editor.isMarkdownMode()
          ? '.toastui-editor-md-preview .toastui-editor-contents'
          : '.toastui-editor-ww-container .ProseMirror';
        const heads = hostRef.current.querySelectorAll(`${base} h1, ${base} h2`);
        heads[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    };

    return () => {
      apiRef.current = null;
      editor.destroy();
      editorRef.current = null;
    };
  }, [apiRef]);

  // Load another document into the same editor instance.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || loadedId.current === doc.id) return;
    loadedId.current = doc.id;
    loading.current = true;
    editor.setMarkdown(doc.markdown, false);
    lastMd.current = editor.getMarkdown();
    loading.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  // Toast UI ships a dark skin as a class on its root element.
  useEffect(() => {
    const root = hostRef.current?.querySelector('.toastui-editor-defaultUI');
    root?.classList.toggle('toastui-editor-dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="editor-view">
      <div className="title-row">
        <input
          className="doc-title"
          value={doc.title}
          placeholder="Untitled"
          maxLength={200}
          onChange={(e) => onEdit({ title: e.target.value })}
          aria-label="Document title"
        />
        <button
          type="button"
          className="export-btn"
          title="Export Markdown (.md)"
          aria-label="Export Markdown"
          onClick={() => exportMarkdown(doc.title, editorRef.current.getMarkdown())}
        >
          <img src="/icons/md.png" alt="" width="26" height="26" />
        </button>
        <button
          type="button"
          className="export-btn"
          title="Export HTML (.html)"
          aria-label="Export HTML"
          onClick={() => exportHTML(doc.title, editorRef.current.getHTML())}
        >
          <img src="/icons/html.png" alt="" width="26" height="26" />
        </button>
      </div>
      <div className="editor-wrap">
        <div className="editor-host" ref={hostRef} />
      </div>
    </div>
  );
}
