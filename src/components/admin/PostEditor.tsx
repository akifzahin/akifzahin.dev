import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading2,
  AlignLeft,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  SquareCode,
  Minus,
  Link as LinkIcon,
  Undo2,
  Redo2,
  ImagePlus,
  X,
} from "lucide-react";

interface PostEditorProps {
  postId?: number; // undefined = new post
}

type SaveStatus = "idle" | "saving" | "saved" | "error";
function testImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
export default function PostEditor({ postId }: PostEditorProps) {
  const [id, setId] = useState<number | undefined>(postId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [loaded, setLoaded] = useState(!postId); // true immediately for new posts
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creating = useRef(false);
  const [isDraft, setIsDraft] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
  const inlineImageInputRef = useRef<HTMLInputElement | null>(null);

  // ── Link popover state ──────────────────────────────────────────────────
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState("");
  const linkInputRef = useRef<HTMLInputElement | null>(null);

  // Force toolbar re-render on selection/transaction changes so is-active
  // classes and the link popover seed value stay in sync with the cursor.
  const [, forceToolbarUpdate] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      TextAlign.configure({ types: ["paragraph", "heading"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: "",
    onUpdate: () => scheduleSave(),
    onSelectionUpdate: () => forceToolbarUpdate((n) => n + 1),
    onTransaction: () => forceToolbarUpdate((n) => n + 1),
    editorProps: {
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain")?.trim();
        if (!text || !/^https?:\/\//i.test(text)) return false;

        event.preventDefault();
        const { from } = view.state.selection;

        testImageUrl(text).then((isImage) => {
          if (isImage) {
            const tr = view.state.tr.insert(
              from,
              view.state.schema.nodes.image.create({ src: text }),
            );
            view.dispatch(tr);
          } else {
            // Not an image — insert as plain text/link instead
            const tr = view.state.tr.insertText(text, from);
            view.dispatch(tr);
          }
        });

        return true;
      },
      handleDOMEvents: {
        keyup: (view) => {
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);

          if (coords.bottom > window.innerHeight - 100) {
            window.scrollTo({
              top: window.scrollY + (coords.bottom - window.innerHeight + 150),
              behavior: "smooth",
            });
          }
        },
      },
    },
  });

  // Load existing post when editing
  useEffect(() => {
    if (!postId) return;
    (async () => {
      const res = await fetch(`/api/admin/posts/${postId}`);
      if (!res.ok) return;
      const post = await res.json();
      setTitle(post.title);
      setDescription(post.description);
      setTagsInput((post.tags || []).join(", "));
      setCoverImage(post.cover_image || "");
      setIsDraft(post.draft === 1);
      editor?.commands.setContent(post.content_json);
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, editor]);

  const doSave = useCallback(async () => {
    if (!loaded) return;
    setStatus("saving");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title,
      description,
      tags,
      cover_image: coverImage || null,
      content_json: editor?.getJSON() ?? {},
    };

    try {
      // First save on a brand-new post: create the row, then switch to PUT for all future saves
      if (!id) {
        if (creating.current) return; // avoid double-create from rapid calls
        creating.current = true;
        const res = await fetch("/api/admin/posts/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title || "Untitled" }),
        });
        const result = await res.json();
        setId(result.id);
        creating.current = false;

        // Immediately follow up with the full content, now that the row exists
        await fetch(`/api/admin/posts/${result.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/admin/posts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [id, title, description, tagsInput, coverImage, editor, loaded]);

  const scheduleSave = useCallback(() => {
    setStatus("idle");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(), 10000); // 10s debounce
  }, [doSave]);

  // Re-schedule autosave when title/description/tags/image change
  useEffect(() => {
    if (!loaded) return;
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, tagsInput, coverImage]);

  const handleManualSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    doSave();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      setCoverImage(result.url);
    } catch {
      setStatus("error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInlineImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setUploadingInlineImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      editor.chain().focus().setImage({ src: result.url }).run();
    } catch {
      setStatus("error");
    } finally {
      setUploadingInlineImage(false);
      e.target.value = ""; // reset so choosing the same file again still fires onChange
    }
  };
  const cycleTextAlign = () => {
    if (!editor) return;
    const current =
      editor.getAttributes("paragraph").textAlign ??
      editor.getAttributes("heading").textAlign ??
      "left";

    const next =
      current === "left" ? "center" : current === "center" ? "right" : "left";

    editor.chain().focus().setTextAlign(next).run();
  };
  const cycleHeading = () => {
    if (!editor) return;
    const levels = [2, 3, 4, 5, 6] as const;
    const current = levels.find((l) =>
      editor.isActive("heading", { level: l }),
    );

    if (!current) {
      // Not currently a heading — start at H2
      editor.chain().focus().toggleHeading({ level: 2 }).run();
      return;
    }

    const nextIndex = levels.indexOf(current) + 1;
    if (nextIndex >= levels.length) {
      // Was H6 — cycle back to paragraph
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: levels[nextIndex] }).run();
    }
  };
  // ── Link handling ────────────────────────────────────────────────────────
  const openLinkPopover = () => {
    if (!editor) return;
    // Seed the input with the existing href if the cursor is already inside a link
    const existingHref = editor.getAttributes("link").href ?? "";
    setLinkUrlInput(existingHref);
    setLinkPopoverOpen(true);
    // Focus the input on next tick, after it mounts
    setTimeout(() => linkInputRef.current?.focus(), 0);
  };

  const commitLink = () => {
    if (!editor) return;
    let url = linkUrlInput.trim();

    if (!url) {
      editor.chain().focus().unsetLink().run();
      setLinkPopoverOpen(false);
      setLinkUrlInput("");
      return;
    }

    // Auto-prepend https:// if the user typed a bare domain (no protocol,
    // not a relative path, not a mailto/tel link)
    const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(url);
    const isRelative = url.startsWith("/") || url.startsWith("#");
    if (!hasProtocol && !isRelative) {
      url = `https://${url}`;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkPopoverOpen(false);
    setLinkUrlInput("");
  };

  const removeLink = () => {
    editor?.chain().focus().unsetLink().run();
    setLinkPopoverOpen(false);
    setLinkUrlInput("");
  };

  const cancelLinkPopover = () => {
    setLinkPopoverOpen(false);
    setLinkUrlInput("");
  };

  const handlePublish = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await doSave();
    if (!id) return;
    setStatus("saving");
    try {
      const res = await fetch(`/api/admin/posts/${id}/publish`, {
        method: "POST",
      });
      const result = await res.json();
      setIsDraft(result.draft === 1);
      setStatus("saved");
      if (result.draft === 0) {
        window.location.href = "/admin";
      }
    } catch {
      setStatus("error");
    }
  };

  if (!loaded) {
    return <p className="font-mono admin-loading">Loading post...</p>;
  }

  return (
    <div className="post-editor">
      <div className="post-editor-meta">
        <input
          className="post-editor-title-input font-display"
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="post-editor-desc-input"
          placeholder="Short description (for the blog card preview)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <div className="post-editor-row">
          <input
            className="post-editor-tags-input"
            type="text"
            placeholder="Tags, comma separated"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
          <div className="post-editor-image-upload">
            <input
              type="file"
              accept="image/*"
              id="cover-image-file"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
            <label
              htmlFor="cover-image-file"
              className="post-editor-image-btn font-mono"
            >
              {uploadingImage
                ? "Uploading..."
                : coverImage
                  ? "Change Cover Image"
                  : "Upload Cover Image"}
            </label>
            <input
              type="text"
              className="post-editor-image-url-input font-mono"
              placeholder="URL path"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) setCoverImage(val);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
            {coverImage && (
              <div className="post-editor-image-preview-wrap">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="post-editor-image-preview"
                />
                <button
                  type="button"
                  className="post-editor-image-remove"
                  aria-label="Remove cover image"
                  onClick={() => setCoverImage("")}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="post-editor-toolbar-wrap">
        <div className="post-editor-toolbar">
          <button
            type="button"
            className={editor?.isActive("bold") ? "is-active" : ""}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            aria-label="Bold"
            data-tooltip="Bold — emphasize text"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            className={editor?.isActive("italic") ? "is-active" : ""}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            data-tooltip="Italic — slant text"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            className={editor?.isActive("strike") ? "is-active" : ""}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
            data-tooltip="Strikethrough — cross out text"
          >
            <Strikethrough size={15} />
          </button>
          <button
            type="button"
            className={editor?.isActive("code") ? "is-active" : ""}
            onClick={() => editor?.chain().focus().toggleCode().run()}
            aria-label="Inline code"
            data-tooltip="Inline Code — mark text as code"
          >
            <Code size={15} />
          </button>
          <button
            type="button"
            className={editor?.isActive("heading") ? "is-active" : ""}
            onClick={cycleHeading}
            aria-label="Heading"
            data-tooltip="Heading — cycle H2 through H6"
          >
            <Heading2 size={15} />
            {editor?.isActive("heading") && (
              <span className="toolbar-btn-badge">
                {editor.getAttributes("heading").level}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={cycleTextAlign}
            aria-label="Align"
            data-tooltip="Align — cycle left, center, right"
          >
            <AlignLeft size={15} />
          </button>
          <button
            type="button"
            className={editor?.isActive("bulletList") ? "is-active" : ""}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
            data-tooltip="Bullet List — unordered list"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            className={editor?.isActive("orderedList") ? "is-active" : ""}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            aria-label="Numbered list"
            data-tooltip="Numbered List — ordered list"
          >
            <ListOrdered size={15} />
          </button>
          <button
            type="button"
            className={editor?.isActive("taskList") ? "is-active" : ""}
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            aria-label="Task list"
            data-tooltip="Task List — checkbox items"
          >
            <ListTodo size={15} />
          </button>
          <button
            type="button"
            className={editor?.isActive("blockquote") ? "is-active" : ""}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            aria-label="Quote"
            data-tooltip="Quote — indented blockquote"
          >
            <Quote size={15} />
          </button>
          <button
            type="button"
            className={editor?.isActive("codeBlock") ? "is-active" : ""}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            aria-label="Code block"
            data-tooltip="Code Block — multi-line code"
          >
            <SquareCode size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            aria-label="Divider"
            data-tooltip="Divider — horizontal rule"
          >
            <Minus size={15} />
          </button>
          <button
            type="button"
            className={editor?.isActive("link") ? "is-active" : ""}
            onClick={openLinkPopover}
            aria-label="Link"
            data-tooltip="Link — add a hyperlink"
          >
            <LinkIcon size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            aria-label="Undo"
            data-tooltip="Undo — revert last change"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            aria-label="Redo"
            data-tooltip="Redo — reapply last change"
          >
            <Redo2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => inlineImageInputRef.current?.click()}
            disabled={uploadingInlineImage}
            aria-label="Insert image"
            data-tooltip="Image — insert into post"
          >
            <ImagePlus size={15} />
          </button>
        </div>

        {linkPopoverOpen && (
          <div className="post-editor-link-popover">
            <input
              ref={linkInputRef}
              type="text"
              className="post-editor-link-input font-mono"
              placeholder="https://example.com"
              value={linkUrlInput}
              onChange={(e) => setLinkUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitLink();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelLinkPopover();
                }
              }}
            />
            <button
              type="button"
              className="post-editor-link-confirm"
              onClick={commitLink}
              aria-label="Set link"
              title="Set link"
            >
              <LinkIcon size={14} />
            </button>
            {editor?.isActive("link") && (
              <button
                type="button"
                className="post-editor-link-remove"
                onClick={removeLink}
                aria-label="Remove link"
                title="Remove link"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              className="post-editor-link-cancel"
              onClick={cancelLinkPopover}
              aria-label="Cancel"
              title="Cancel"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        ref={inlineImageInputRef}
        style={{ display: "none" }}
        onChange={handleInlineImageUpload}
      />
      <EditorContent editor={editor} className="post-editor-body" />

      <div className="post-editor-actions">
        <span className="post-editor-status font-mono">
          {status === "saving" && "Saving..."}
          {status === "saved" && "Saved"}
          {status === "error" && "Save failed"}
          {status === "idle" && "Unsaved changes"}
        </span>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleManualSave}
          >
            <span className="btn-label">Save Draft</span>
          </button>
          <button type="button" className="btn-primary" onClick={handlePublish}>
            <span className="btn-label">
              {isDraft ? "Publish" : "Unpublish"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
